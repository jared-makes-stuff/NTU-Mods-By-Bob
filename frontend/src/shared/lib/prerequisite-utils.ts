/**
 * Module Prerequisites Utilities
 * 
 * Shared utility functions for parsing and validating module prerequisites.
 * Handles various prerequisite formats from different sources.
 * 
 * Used by:
 * - course-planner page (module import/export)
 * - PrerequisiteFlowChart component (visualization)
 * - module-info page (display)
 */

/**
 * Module Code Validator
 * 
 * Checks if a string matches the standard NTU module code format.
 * 
 * Pattern: 2-4 uppercase letters + 4 digits + optional letter
 * - Subject prefix: 2-4 letters (e.g., CS, SC, GER, GESS)
 * - Course number: 4 digits (e.g., 1010, 2030)
 * - Variant suffix: Optional single letter (e.g., S, E)
 * 
 * @param {string} str - String to validate
 * @returns {boolean} True if valid module code
 * 
 * @example
 * isModuleCode('CS1010')    // true
 * isModuleCode('CS2030S')   // true
 * isModuleCode('GEA1000')   // true
 * isModuleCode('GESS1000T') // true
 * isModuleCode('Math 101')  // false
 * isModuleCode('Passing CS1010') // false
 */
export function isModuleCode(str: string): boolean {
  const trimmed = str.trim();
  return /^[A-Z]{2,4}\d{4}[A-Z]?$/i.test(trimmed);
}

/**
 * Parse Prerequisites String to Module Codes Array
 * 
 * Extracts module codes from prerequisite strings in various formats.
 * Handles both plain strings and backend JSONB objects.
 * 
 * Supported Input Formats:
 * 1. Plain string: "CS1010 or CS1101S and MA1521"
 * 2. JSONB with text: { text: "CS1010 or CS1101S" }
 * 3. JSONB with codes array: { codes: ["CS1010", "CS1101S"] }
 * 4. Complex string: "Must complete CS1010 (4 AU) and either MA1521 or MA1508E"
 * 
 * Parsing Logic:
 * - Splits by: "or", "OR", "and", "AND", comma, semicolon, ampersand
 * - Filters for valid module codes using regex pattern
 * - Removes duplicates and sorts alphabetically
 * - Ignores text descriptions and credit units
 * 
 * @param {string | object | undefined} prereqString - Prerequisites in various formats
 * @returns {string[]} Array of unique module codes in uppercase, sorted
 * 
 * @example
 * parsePrerequisites("CS1010 or CS1101S and MA1521")
 * // Returns: ["CS1010", "CS1101S", "MA1521"]
 * 
 * @example
 * parsePrerequisites({ text: "CS1010 or CS1101S" })
 * // Returns: ["CS1010", "CS1101S"]
 * 
 * @example
 * parsePrerequisites({ codes: ["CS1010", "CS1101S"] })
 * // Returns: ["CS1010", "CS1101S"]
 * 
 * @example
 * parsePrerequisites("Must complete CS1010 (4 AU) and either MA1521 or MA1508E")
 * // Returns: ["CS1010", "MA1508E", "MA1521"]
 */
export function parsePrerequisites(prereqString?: unknown): string[] {
  if (!prereqString) return [];
  
  // If prerequisites is an object (from backend JSONB), convert to string
  let prereqText = '';
  if (typeof prereqString === 'object') {
    const prereqRecord = prereqString as Record<string, unknown>;
    // Handle JSONB structure - extract text from nested object
    if (typeof prereqRecord.text === 'string') {
      prereqText = prereqRecord.text;
    } else if (Array.isArray(prereqRecord.codes) && prereqRecord.codes.every((code) => typeof code === 'string')) {
      // If codes array exists, return it directly
      return prereqRecord.codes.map((code) => code.toUpperCase()).sort();
    } else {
      // Try to stringify the object and parse it
      prereqText = JSON.stringify(prereqRecord);
    }
  } else {
    prereqText = String(prereqString);
  }
  
  // Split by common delimiters (or, and, comma, semicolon, ampersand)
  const parts = prereqText
    .split(/\s+or\s+|\s+OR\s+|\s+and\s+|\s+AND\s+|,|;|&/i)
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // Extract module codes using regex pattern
  const moduleCodes: string[] = [];
  const moduleCodeRegex = /[A-Z]{2,4}\d{4}[A-Z]?/gi;
  
  parts.forEach(part => {
    const matches = part.match(moduleCodeRegex);
    if (matches) {
      matches.forEach(match => {
        const upperCode = match.toUpperCase();
        if (!moduleCodes.includes(upperCode)) {
          moduleCodes.push(upperCode);
        }
      });
    }
  });
  
  return moduleCodes.sort();
}

/**
 * Prerequisite Group Structure
 * Used for structured visualization (AND/OR trees)
 */
export interface PrereqGroup {
  type: 'AND' | 'OR';
  modules: string[];
}

/**
 * Parse Prerequisites Structured
 * 
 * Parses prerequisites into logical groups (AND/OR) for visualization.
 * Preserves the logical structure better than the detailed parser.
 * 
 * @param {string} prerequisites - Raw prerequisite string
 * @returns {Object} Structured data with groups, coreqs, and text
 */
export function parsePrerequisitesStructured(prerequisites: string): {
  groups: PrereqGroup[];
  corequisites: string[];
  textDescriptions: string[];
} {
  if (!prerequisites || prerequisites.trim() === '') {
    return { groups: [], corequisites: [], textDescriptions: [] };
  }

  const corequisites: string[] = [];
  const textDescriptions: string[] = [];
  const groups: PrereqGroup[] = [];

  // Extract corequisites
  const coreqRegex = /([A-Z]{2,4}\d{4}[A-Z]?)\s*\(.*?co[-\s]?req.*?\)/gi;
  let match;
  while ((match = coreqRegex.exec(prerequisites)) !== null) {
    corequisites.push(match[1].toUpperCase());
  }

  // Clean string
  const cleaned = prerequisites.replace(/\(.*?co[-\s]?req.*?\)/gi, '');
  
  // Split by top-level AND delimiters (comma, semicolon, "and", "&")
  // We use a capture group for delimiters to inspect them if needed, but here just split
  const parts = cleaned.split(/[,;&]|\s+and\s+(?![^(]*\))/i).filter(p => p.trim());

  parts.forEach(part => {
    const moduleCodeRegex = /[A-Z]{2,4}\d{4}[A-Z]?/gi;
    const foundModules = part.match(moduleCodeRegex);

    if (foundModules) {
      const uniqueModules = Array.from(new Set(foundModules.map(m => m.toUpperCase())));
      
      // Determine if this part is an OR group
      // Look for "or" or "/" between modules
      const isOrGroup = /\s+or\s+|\//i.test(part);

      if (isOrGroup && uniqueModules.length > 1) {
        groups.push({
          type: 'OR',
          modules: uniqueModules
        });
      } else {
        // Treated as 'AND' (required modules). 
        // Even if multiple modules are found without explicit OR, usually standard parser separates them.
        // If we found "CS1 CS2" without separators, it's ambiguous, but we'll assume required.
        // We push them as separate single-module AND groups for cleaner graph, or one AND group.
        // Let's push as individual requirements to avoid clutter unless they are explicitly grouped?
        // Actually, if we want to support "AND nodes" in graph, pushing as separate SINGLE items is fine, 
        // the visualizer handles aggregation.
        
        // However, if the user explicitly wants "AND" grouping visual, we can keep them together if they came from one chunk?
        // But usually "A, B" splits into parts A and B. 
        // So here we likely have single modules.
        groups.push({
          type: 'AND',
          modules: uniqueModules
        });
      }

      // Text extraction similar to detailed parser
      let remainingText = part;
      foundModules.forEach(m => {
        remainingText = remainingText.replace(m, '');
      });
      remainingText = remainingText.replace(/\s+or\s+|\s+OR\s+|\//gi, ' ').trim();
      remainingText = remainingText.replace(/\s+/g, ' ');
      
      if (remainingText && !/^(or|and|;|&)+$/i.test(remainingText)) {
        textDescriptions.push(remainingText);
      }
    } else {
      const trimmed = part.trim();
      if (trimmed && !/^(or|and|;|&)+$/i.test(trimmed)) {
        textDescriptions.push(trimmed);
      }
    }
  });

  return { groups, corequisites, textDescriptions };
}


/**
 * Format Prerequisites for Display
 * 
 * Converts prerequisite array back to human-readable string.
 * 
 * @param {string[]} prerequisites - Array of module codes
 * @param {string} [separator=' or '] - Separator between modules
 * @returns {string} Formatted prerequisite string
 * 
 * @example
 * formatPrerequisites(['CS1010', 'CS1101S'])
 * // Returns: "CS1010 or CS1101S"
 * 
 * @example
 * formatPrerequisites(['CS1010', 'CS1101S'], ' and ')
 * // Returns: "CS1010 and CS1101S"
 */
export function formatPrerequisites(
  prerequisites: string[],
  separator: string = ' or '
): string {
  return prerequisites.join(separator);
}

/**
 * Check if Module has Prerequisites
 * 
 * Determines if a module has any prerequisites (simple check).
 * 
 * @param {string | object | undefined} prereqString - Prerequisites in various formats
 * @returns {boolean} True if module has prerequisites
 * 
 * @example
 * hasPrerequisites('CS1010 or CS1101S') // true
 * hasPrerequisites('') // false
 * hasPrerequisites(null) // false
 */
export function hasPrerequisites(prereqString?: unknown): boolean {
  return parsePrerequisites(prereqString).length > 0;
}

/**
 * Parse Prerequisites with Detailed Structure
 * 
 * Extracts prerequisites with detailed information for flowchart visualization.
 * Returns flat list of module codes, corequisites, and text descriptions.
 * 
 * @param {string} prerequisites - Prerequisites string to parse
 * @returns {object} Object with moduleCodes, textDescriptions, and corequisites
 * 
 * @example
 * parsePrerequisitesDetailed('CS1010 or CS1101S and MA1521 (coreq)')
 * // Returns: { moduleCodes: ['CS1010', 'CS1101S', 'MA1521'], textDescriptions: [], corequisites: ['MA1521'] }
 */
export function parsePrerequisitesDetailed(prerequisites: string): {
  moduleCodes: string[];
  textDescriptions: string[];
  corequisites: string[];
} {
  const { groups, corequisites, textDescriptions } = parsePrerequisitesStructured(prerequisites);
  
  // Flatten all module codes from groups
  const moduleCodes = Array.from(new Set(
    groups.flatMap(group => group.modules)
  ));
  
  return {
    moduleCodes,
    textDescriptions,
    corequisites
  };
}
