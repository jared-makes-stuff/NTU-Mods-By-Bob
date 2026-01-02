/**
 * Vacancy service data contracts.
 */

/** Parsed class session row. */
export interface ClassSession {
  type: string;
  group: string;
  day: string;
  time: string;
  venue: string;
  remark?: string;
}

/** Vacancy payload for a single index. */
export interface IndexVacancy {
  index: string;
  vacancy: number;
  waitlist: number;
  classes: ClassSession[];
}

/** Response shape for course vacancy queries. */
export interface VacancyResult {
  success: boolean;
  data?: IndexVacancy[];
  error?: string;
  errorMessage?: string;
  statusCode?: number;
}

/** Response shape for single index vacancy queries. */
export interface SingleIndexResult {
  success: boolean;
  data?: IndexVacancy;
  error?: string;
  errorMessage?: string;
}

/** Cached vacancy entry metadata. */
export interface CacheEntry {
  data: IndexVacancy[];
  timestamp: number;
  courseCode: string;
}
