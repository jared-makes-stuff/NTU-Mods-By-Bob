/**
 * Timetable generation filter types shared across API + feature layers.
 */
export type FilterPreference = "important" | "preferred" | "not-preferred";

export interface GenerationFilters {
  dayDuration: {
    min: number;
    max: number;
    enabled: boolean;
  };
  consecutiveClasses: {
    min: number;
    max: number;
    enabled: boolean;
  };
  gapsBetweenClasses: {
    min: number;
    max: number;
    enabled: boolean;
  };
  dayStartEnd: {
    startAfter: string;
    endBefore: string;
    startEnabled: boolean;
    endEnabled: boolean;
  };
  daysOfWeek: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  dailyLoad: {
    preference: "skewed" | "balanced";
    enabled: boolean;
  };
  classesToConsider: {
    tutorial: boolean;
    lab: boolean;
    seminar: boolean;
    lecture: boolean;
    project: boolean;
    design: boolean;
  };
  venuePreference: {
    includeOnline: boolean;
    includeInPerson: boolean;
  };
  generationGoals: {
    balanceWorkload: boolean;
    minimizeDays: boolean;
    consecutiveDays: boolean;
  };
}
