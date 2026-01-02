/**
 * External API data contracts and derived shapes.
 */

/** Raw module content row from external API. */
export interface NTUCourseContent {
  course_code: string;
  acadsem: string;
  title: string;
  au: number;
  description: string;
  prerequisites: string | null;
  mutual_exclusions: string | null;
  department_code: string;
  not_available_to_programme: string | null;
  not_available_to_all_programme_with: string | null;
  is_broadening_deepening_elective: boolean;
  is_unrestricted_elective: boolean;
  grade_type: string;
  updated_at: string;
}

/** Raw schedule row from external API. */
export interface NTUCourseSchedule {
  course_code: string;
  acadsem: string;
  index: string;
  type: string;
  group: string;
  day: string;
  time: string;
  venue: string;
  remark: string;
  created_at: string;
}

/** Raw exam timetable row from external API. */
export interface NTUExamTimetable {
  course_code: string;
  acadsem: string;
  exam_date: string | null;
  exam_time: string | null;
  exam_duration: string | null;
  venue: string | null;
  seat_no: string | null;
  student_type: string;
  exam_type: string | null;
  course_title: string | null;
  academic_session: string | null;
  plan_no: string | null;
  created_at: string;
  updated_at: string;
}

/** Normalized schedule time slot. */
export interface ParsedTimeSlot {
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  group: string | null;
  weeks: number[];
}

/** Normalized module record for persistence. */
export interface ModuleRecord {
  code: string;
  semester: string;
  name: string;
  au: number;
  school: string;
  description: string | null;
  prerequisites: string | { or: string[] } | null;
  department: string | null;
  gradeType: string | null;
  mutualExclusions: string | null;
  notAvailableTo: string | null;
  notAvailableToAllWith: string | null;
  bde: boolean;
  unrestrictedElective: boolean;
  examDateTime: string | null;
  examDuration: number | null;
}
