/**
 * Timetable generation contracts.
 */

/** Filter payload for timetable generation. */
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
    preference: 'skewed' | 'balanced';
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

/** Module request payload for generation inputs. */
export interface ModuleForGeneration {
  code: string;
  indexNumbers: string[];
}

/** Combination payload returned from the generator. */
export interface TimetableCombination {
  id?: string;
  modules: Array<{
    code: string;
    name: string;
    au: number;
    indexNumber: string;
  }>;
  classes: Array<{
    moduleCode: string;
    moduleName: string;
    indexNumber: string;
    type: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    weeks: string;
  }>;
  score?: number;
  stats?: {
    totalDays: number;
    totalHours: number;
    averageGapDuration: number;
    earliestStart: string;
    latestEnd: string;
  };
}
