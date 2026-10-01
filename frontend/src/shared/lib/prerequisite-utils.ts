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
    } else if (Array.isArray(prereqRecord.or) && prereqRecord.or.every((code) => typeof code === 'string')) {
      // Handle 'or' array format from backend
      return prereqRecord.or.map((code) => code.toUpperCase()).sort();
    } else {
      // Handle complex nested structures (like ones with hyperlinks)
      // Extract all text content recursively (keep URLs as they contain no module codes)
      const extractText = (obj: unknown): string[] => {
        if (typeof obj === 'string') {
          return [obj];
        }
        if (Array.isArray(obj)) {
          return obj.flatMap(extractText);
        }
        if (obj && typeof obj === 'object') {
          return Object.entries(obj).flatMap(([key, val]) => {
            const keyText = key.trim() ? [key] : [];
            const valText = extractText(val);
            return [...keyText, ...valText];
          });
        }
        return [];
      };

      const textParts = extractText(prereqRecord).filter(Boolean);
      prereqText = textParts.join(' ');
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
  operator: 'AND' | 'OR';
} {
  if (!prerequisites || prerequisites.trim() === '') {
    return { groups: [], corequisites: [], textDescriptions: [], operator: 'AND' };
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

  // Clean string (keep URLs for text descriptions, they'll be extracted separately)
  const cleaned = prerequisites.replace(/\(.*?co[-\s]?req.*?\)/gi, '').replace(/\s+/g, ' ').trim();

  const moduleCodeRegex = /[A-Z]{2,4}\d{4}[A-Z]?/gi;

  const isWordChar = (char?: string) => !!char && /[A-Za-z0-9]/.test(char);
  const matchesWord = (value: string, index: number, word: string) => {
    const end = index + word.length;
    if (value.slice(index, end).toLowerCase() !== word) return false;
    const prev = index > 0 ? value[index - 1] : '';
    const next = end < value.length ? value[end] : '';
    if (isWordChar(prev) || isWordChar(next)) return false;
    return true;
  };

  const splitTopLevel = (value: string, operator: 'OR' | 'AND') => {
    const parts: string[] = [];
    let depth = 0;
    let buffer = '';

    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];
      if (char === '(') depth += 1;
      if (char === ')') depth = Math.max(0, depth - 1);

      if (depth === 0) {
        if (operator === 'OR') {
          if (matchesWord(value, i, 'or')) {
            if (buffer.trim()) parts.push(buffer.trim());
            buffer = '';
            i += 1;
            continue;
          }
          if (char === '/') {
            if (buffer.trim()) parts.push(buffer.trim());
            buffer = '';
            continue;
          }
        } else {
          if (matchesWord(value, i, 'and')) {
            if (buffer.trim()) parts.push(buffer.trim());
            buffer = '';
            i += 2;
            continue;
          }
          if (char === '&' || char === ',' || char === ';') {
            if (buffer.trim()) parts.push(buffer.trim());
            buffer = '';
            continue;
          }
        }
      }

      buffer += char;
    }

    if (buffer.trim()) {
      parts.push(buffer.trim());
    }

    return parts;
  };

  const stripOperators = (value: string) =>
    value
      .replace(moduleCodeRegex, '')
      .replace(/\b(or|and)\b/gi, ' ')
      .replace(/[&/,;]/g, ' ')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const stripOuterParens = (value: string) => {
    let trimmed = value.trim();
    while (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      let depth = 0;
      let isWrapped = true;

      for (let i = 0; i < trimmed.length; i += 1) {
        const char = trimmed[i];
        if (char === '(') depth += 1;
        if (char === ')') depth -= 1;

        if (depth === 0 && i < trimmed.length - 1) {
          isWrapped = false;
          break;
        }
      }

      if (!isWrapped || depth !== 0) {
        break;
      }

      trimmed = trimmed.slice(1, -1).trim();
    }

    return trimmed;
  };

  const orParts = splitTopLevel(cleaned, 'OR');
  const operator: 'AND' | 'OR' = orParts.length > 1 ? 'OR' : 'AND';
  const topLevelParts = operator === 'OR' ? orParts : splitTopLevel(cleaned, 'AND');
  const textDescriptionSet = new Set<string>();

  const addTextDescription = (value: string) => {
    const remaining = stripOperators(value);
    if (remaining && !/^(or|and)$/i.test(remaining)) {
      textDescriptionSet.add(remaining);
    }
  };

  const buildGroup = (segment: string): PrereqGroup | null => {
    const normalized = stripOuterParens(segment);
    if (!normalized) return null;

    const nestedOrParts = splitTopLevel(normalized, 'OR');
    const nestedAndParts = splitTopLevel(normalized, 'AND');
    let groupType: 'AND' | 'OR' = 'AND';
    let parts = [normalized];

    if (nestedOrParts.length > 1) {
      groupType = 'OR';
      parts = nestedOrParts;
    } else if (nestedAndParts.length > 1) {
      groupType = 'AND';
      parts = nestedAndParts;
    }

    const moduleSet = new Set<string>();

    parts.forEach((part) => {
      const matches = part.match(moduleCodeRegex);
      if (matches) {
        matches.forEach((code) => moduleSet.add(code.toUpperCase()));
      }
      addTextDescription(part);
    });

    if (moduleSet.size > 0) {
      return {
        type: groupType,
        modules: Array.from(moduleSet),
      };
    }

    addTextDescription(normalized);
    return null;
  };

  topLevelParts.forEach((part) => {
    const group = buildGroup(part);
    if (group) {
      groups.push(group);
    }
  });

  textDescriptions.push(...Array.from(textDescriptionSet));

  return { groups, corequisites, textDescriptions, operator };
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
