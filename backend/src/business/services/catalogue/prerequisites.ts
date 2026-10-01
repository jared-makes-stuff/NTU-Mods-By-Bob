function extractCodesFromString(value: string): string[] {
  const matches = value.match(/\b[A-Z]{2,}[0-9]{4}[A-Z]?\b/g) || [];
  return matches.map((match) => match.toUpperCase());
}

export function collectPrerequisiteCodes(tree: unknown, set: Set<string>): void {
  if (!tree) return;

  if (typeof tree === 'string') {
    extractCodesFromString(tree).forEach((code) => set.add(code));
    return;
  }

  if (Array.isArray(tree)) {
    tree.forEach((entry) => collectPrerequisiteCodes(entry, set));
    return;
  }

  if (typeof tree === 'object') {
    const record = tree as Record<string, unknown>;
    if (record.and) {
      collectPrerequisiteCodes(record.and, set);
    }
    if (record.or) {
      collectPrerequisiteCodes(record.or, set);
    }
  }
}

export function hasPrerequisiteCode(tree: unknown, code: string): boolean {
  const target = code.toUpperCase();
  const codes = new Set<string>();
  collectPrerequisiteCodes(tree, codes);
  return codes.has(target);
}
