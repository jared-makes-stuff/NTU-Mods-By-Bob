/**
 * Mapping helpers for external API module content.
 */

import { ModuleRecord, NTUCourseContent, NTUExamTimetable } from './types';
import {
  formatExamDateTime,
  normalizeSemester,
  parseExamDuration,
  parsePrerequisites,
} from './externalApiParser';

/**
 * Build a normalized module record for persistence.
 */
export function buildModuleRecord(
  courseContent: NTUCourseContent,
  examData: NTUExamTimetable | undefined
): { normalizedSemester: string | null; record: ModuleRecord | null } {
  const normalizedSemester = courseContent.acadsem
    ? normalizeSemester(courseContent.acadsem)
    : null;

  if (!normalizedSemester) {
    return { normalizedSemester: null, record: null };
  }

  const prerequisites = parsePrerequisites(courseContent.prerequisites);
  const examDateTime = formatExamDateTime(examData);
  const examDuration = parseExamDuration(examData);

  const au =
    courseContent.au !== null && courseContent.au !== undefined && !isNaN(courseContent.au)
      ? courseContent.au
      : 0;

  const record: ModuleRecord = {
    code: courseContent.course_code,
    semester: normalizedSemester,
    name: courseContent.title,
    au,
    school: courseContent.department_code || 'Unknown',
    description: courseContent.description || null,
    prerequisites,
    department: courseContent.department_code || null,
    gradeType: courseContent.grade_type || null,
    mutualExclusions: courseContent.mutual_exclusions || null,
    notAvailableTo: courseContent.not_available_to_programme || null,
    notAvailableToAllWith: courseContent.not_available_to_all_programme_with || null,
    bde: courseContent.is_broadening_deepening_elective ?? false,
    unrestrictedElective: courseContent.is_unrestricted_elective ?? false,
    examDateTime,
    examDuration,
  };

  return { normalizedSemester, record };
}
