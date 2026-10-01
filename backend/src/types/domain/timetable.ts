import type { DayOfWeek } from './module';

/**
 * Timetable Planner types
 */

/**
 * Module selection for timetable generation
 * Specifies which module and which indexes to consider
 */
export interface ModuleSelection {
  moduleCode: string;
  indexNumber?: string;          // If specified, use this exact index
  enabledIndexes?: string[];     // If no indexNumber, consider these indexes for generation
}

/**
 * User preferences for timetable generation
 * Guides the optimization algorithm
 */
export interface TimetablePreferences {
  avoidDays?: DayOfWeek[];
  avoidTimeRanges?: {
    start: string;  // Format: "HHmm"
    end: string;    // Format: "HHmm"
  }[];
  preferCompactSchedule?: boolean;  // Minimize gaps between classes
  maxDaysPerWeek?: number;
  preferMorning?: boolean;          // Prefer classes before 12:00
  preferAfternoon?: boolean;        // Prefer classes after 12:00
}

/**
 * Scheduled slot in a timetable
 * Represents one class session
 */
export interface ScheduledSlot {
  moduleCode: string;
  moduleName: string;
  indexNumber: string;
  timeSlot: {
    id: string;
    type: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    group?: string;
    weeks: number[];
  };
  color?: string;
}

/**
 * Generated timetable with metadata
 */
export interface GeneratedTimetable {
  id: string;
  modules: ModuleSelection[];
  schedule: ScheduledSlot[];
  score?: number;  // Optimization score (higher is better)
  metrics?: {
    totalDays: number;
    gapsHours: number;
    earliestClass: string;
    latestClass: string;
  };
}

/**
 * Conflict detection result
 */
export interface Conflict {
  type: 'time' | 'prerequisite' | 'corequisite';
  message: string;
  modules: string[];  // Module codes involved in the conflict
  details?: unknown;  // Additional context-specific details
}
