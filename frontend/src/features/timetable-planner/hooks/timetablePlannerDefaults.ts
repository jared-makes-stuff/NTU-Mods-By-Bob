import type { GenerationFilters } from "../types";

/**
 * Returns the default generation filter settings.
 */
export const getDefaultGenerationFilters = (): GenerationFilters => ({
  dayDuration: { min: 4, max: 8, enabled: false },
  consecutiveClasses: { min: 1, max: 3, enabled: false },
  gapsBetweenClasses: { min: 1, max: 2, enabled: false },
  dayStartEnd: {
    startAfter: "08:00",
    endBefore: "23:00",
    startEnabled: false,
    endEnabled: false,
  },
  daysOfWeek: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
  },
  dailyLoad: { preference: "skewed", enabled: false },
  classesToConsider: {
    tutorial: true,
    lab: true,
    seminar: true,
    lecture: true,
    project: true,
    design: true,
  },
  venuePreference: { includeOnline: true, includeInPerson: true },
  generationGoals: { balanceWorkload: false, minimizeDays: false, consecutiveDays: false },
});
