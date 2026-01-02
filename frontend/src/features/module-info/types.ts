import type { Module } from "@/shared/api/types";

export interface ModuleWithIndexes extends Module {
  examDate?: string;
  indexes?: Array<{
    indexNumber: string;
    type: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    vacancy?: number;
    waitlist?: number;
  }>;
}

/**
 * Timetable preview index entry for the module detail view.
 */
export interface ModulePreviewIndex {
  indexNumber: string;
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
}
