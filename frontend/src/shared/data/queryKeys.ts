/**
 * Centralized React Query keys for consistency and cache safety.
 */
const moduleKeys = {
  root: ["modules"] as const,
  search: (filters: Record<string, unknown>) => [...moduleKeys.root, "search", filters] as const,
  details: (moduleCode: string) => [...moduleKeys.root, "details", moduleCode] as const,
  dependencies: (moduleCode: string) => [...moduleKeys.root, "dependencies", moduleCode] as const,
};

export const queryKeys = {
  semesters: ["semesters"] as const,
  modules: moduleKeys,
  timetables: ["timetables"] as const,
};
