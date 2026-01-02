/**
 * Normalized timetable entry used by preview and display components.
 */
export interface IndexData {
  indexNumber: string;
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  moduleCode?: string;
  weeks?: string;
  isCustomEvent?: boolean;
  vacancy?: number;
  waitlist?: number;
}
