/**
 * Centralized React Query keys for consistency and cache safety.
 */
const moduleKeys = {
  root: ["modules"] as const,
  search: (filters: Record<string, unknown>) => [...moduleKeys.root, "search", filters] as const,
  details: (moduleCode: string) => [...moduleKeys.root, "details", moduleCode] as const,
  dependencies: (moduleCode: string) => [...moduleKeys.root, "dependencies", moduleCode] as const,
};

const coursePlanKeys = {
  root: ["course-plans"] as const,
  list: () => [...coursePlanKeys.root] as const,
  detail: (planId: string) => [...coursePlanKeys.root, planId] as const,
};

const vacancyAlertKeys = {
  root: ["vacancy-alerts"] as const,
  tasks: (refresh = false) => [...vacancyAlertKeys.root, "tasks", { refresh }] as const,
  telegramStatus: () => [...vacancyAlertKeys.root, "telegram-status"] as const,
};

export const queryKeys = {
  semesters: ["semesters"] as const,
  modules: moduleKeys,
  coursePlans: coursePlanKeys,
  timetables: ["timetables"] as const,
  vacancyAlerts: vacancyAlertKeys,
};
