/**
 * Module-related types
 */

/**
 * Prerequisite tree structure (recursive)
 * Supports complex prerequisite logic with AND/OR operators
 */
export type PrerequisiteTree =
  | string
  | { and: PrerequisiteTree[] }
  | { or: PrerequisiteTree[] };

/**
 * Module metadata stored in JSONB field
 * Flexible structure for additional module information
 */
export interface ModuleMetadata {
  syllabus?: string;
  grading?: {
    exam?: number;        // Percentage (0-100)
    coursework?: number;  // Percentage (0-100)
    practical?: number;   // Percentage (0-100)
  };
  learningOutcomes?: string[];
  gradeDistribution?: {
    'A+'?: number;
    'A'?: number;
    'A-'?: number;
    'B+'?: number;
    'B'?: number;
    'B-'?: number;
    'C+'?: number;
    'C'?: number;
    'D'?: number;
    'F'?: number;
  };
}

/**
 * Time slot day enumeration
 */
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

/**
 * Lesson type enumeration
 */
export type LessonType = 'LEC' | 'TUT' | 'LAB' | 'SEM' | 'WRK';
