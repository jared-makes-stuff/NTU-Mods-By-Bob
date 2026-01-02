/**
 * Grouping helpers for external API payloads.
 */

import { NTUCourseSchedule, NTUExamTimetable } from './types';
import { normalizeSemester, parseSemesterValue } from './externalApiParser';

/**
 * Group schedules by module code and normalized semester.
 */
export function groupSchedules(
  schedules: NTUCourseSchedule[]
): Map<string, NTUCourseSchedule[]> {
  const map = new Map<string, NTUCourseSchedule[]>();

  for (const schedule of schedules) {
    const normalizedSem = normalizeSemester(schedule.acadsem);
    const key = `${schedule.course_code}_${normalizedSem}`;

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(schedule);
  }

  return map;
}

/**
 * Group exam data by module code, keeping the latest semester entry.
 */
export function groupExamData(
  exams: NTUExamTimetable[]
): Map<string, NTUExamTimetable> {
  const map = new Map<string, NTUExamTimetable>();

  for (const exam of exams) {
    const key = exam.course_code;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, exam);
    } else {
      const existingSem = parseSemesterValue(existing.acadsem);
      const newSem = parseSemesterValue(exam.acadsem);
      if (newSem > existingSem) {
        map.set(key, exam);
      }
    }
  }

  return map;
}
