/**
 * Parsing helpers for external API payloads.
 */

import { NTUCourseSchedule, NTUExamTimetable, ParsedTimeSlot } from './types';
import { logger } from '../../../config/logger';

/**
 * Normalize semester string formats into a consistent delimiter.
 */
export function normalizeSemester(acadsem: string): string {
  return acadsem.replace(';', '_');
}

/**
 * Parse semester string to a sortable numeric value (YYYY*10 + SEM).
 */
export function parseSemesterValue(semester: string): number {
  if (!semester) return 0;

  const parts = semester.split(/[;_]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    const year = parseInt(parts[0]) || 0;
    const sem = parseInt(parts[1]) || 0;
    return year * 10 + sem;
  }

  return parseInt(semester) || 0;
}

/**
 * Normalize day strings to a 3-letter format.
 */
export function normalizeDay(day: string): string {
  const normalized = day.toUpperCase().substring(0, 3);
  const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  if (validDays.includes(normalized)) {
    return normalized;
  }

  logger.warn(`Invalid day format: ${day}, defaulting to MON`);
  return 'MON';
}

/**
 * Parse week remarks into a list of week numbers.
 */
export function parseWeeks(remark: string): number[] {
  if (!remark || remark.trim() === '') {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  }

  const weekMatch = remark.match(/Wk(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)/i);
  if (!weekMatch || !weekMatch[1]) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  }

  const weekPattern = weekMatch[1];
  const weeks: number[] = [];
  const parts = weekPattern.split(',');

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (start && end) {
        for (let i = start; i <= end; i++) {
          weeks.push(i);
        }
      }
    } else {
      const week = Number(part);
      if (!isNaN(week)) {
        weeks.push(week);
      }
    }
  }

  return weeks.length > 0 ? weeks.sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
}

/**
 * Parse a schedule row into a normalized time slot.
 */
export function parseTimeSlot(schedule: NTUCourseSchedule): ParsedTimeSlot | null {
  if (!schedule.time || schedule.time.trim() === '') {
    return null;
  }

  const timeParts = schedule.time.split('-');
  if (timeParts.length !== 2) {
    if (schedule.time.trim().length > 0) {
      logger.warn(
        `Invalid time format for ${schedule.course_code} [${schedule.index}]: "${schedule.time}"`
      );
    }
    return null;
  }

  const startTime = timeParts[0]!.trim();
  const endTime = timeParts[1]!.trim();

  if (!startTime || !endTime) {
    return null;
  }

  const type = schedule.type?.split('/')[0]?.trim() || 'LEC';
  const day = normalizeDay(schedule.day);
  const weeks = parseWeeks(schedule.remark);

  return {
    type,
    day,
    startTime,
    endTime,
    venue: schedule.venue || 'TBA',
    group: schedule.group || null,
    weeks,
  };
}

/**
 * Format exam date/time fields into a single string.
 */
export function formatExamDateTime(examData: NTUExamTimetable | undefined): string | null {
  if (!examData || !examData.exam_date || !examData.exam_time) {
    return null;
  }

  return `${examData.exam_date} ${examData.exam_time}`;
}

/**
 * Parse exam duration into minutes.
 */
export function parseExamDuration(examData: NTUExamTimetable | undefined): number | null {
  if (!examData || !examData.exam_duration) {
    if (examData?.exam_time) {
      const parts = examData.exam_time.split('-');
      if (parts.length === 2) {
        const [start, end] = parts;
        const [startH, startM] = start!.split(':').map(Number);
        const [endH, endM] = end!.split(':').map(Number);
        if (
          startH !== undefined &&
          startM !== undefined &&
          endH !== undefined &&
          endM !== undefined
        ) {
          const startMin = startH * 60 + startM;
          const endMin = endH * 60 + endM;
          return endMin - startMin;
        }
      }
    }
    return null;
  }

  const durationStr = examData.exam_duration.toLowerCase().trim();

  if (durationStr.includes('hr') || durationStr.includes('hour')) {
    const hours = parseFloat(durationStr);
    if (!isNaN(hours)) {
      return Math.round(hours * 60);
    }
  }

  if (durationStr.includes('min')) {
    const mins = parseInt(durationStr);
    if (!isNaN(mins)) return mins;
  }

  const val = parseFloat(durationStr);
  if (!isNaN(val)) {
    if (val <= 10) return Math.round(val * 60);
    return Math.round(val);
  }

  return null;
}

/**
 * Parse prerequisite strings into a structured form.
 */
export function parsePrerequisites(
  prerequisites: string | null
): string | { or: string[] } | null {
  if (!prerequisites || prerequisites.trim() === '') {
    return null;
  }

  const codes = prerequisites
    .split(/[,;]/)
    .map((code: string) => code.trim())
    .filter((code: string) => code.length > 0);

  if (codes.length === 0) {
    return null;
  }

  return codes.length === 1 ? (codes[0] ?? null) : { or: codes };
}



