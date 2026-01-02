/**
 * Persistence helpers for external API ingestion.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { SyncResult } from '../../../types/domain';
import { NTUCourseContent, NTUCourseSchedule, NTUExamTimetable, ParsedTimeSlot } from './types';
import { buildModuleRecord } from './externalApiMapper';
import { normalizeSemester, parseTimeSlot } from './externalApiParser';
import { logger } from '../../../config/logger';

/**
 * Upsert a module and its schedules into the database.
 */
export async function processModule(
  courseContent: NTUCourseContent,
  schedules: NTUCourseSchedule[],
  examData: NTUExamTimetable | undefined,
  result: SyncResult
): Promise<void> {
  const moduleCode = courseContent.course_code;
  const { normalizedSemester, record } = buildModuleRecord(courseContent, examData);

  if (!normalizedSemester || !record) {
    logger.warn(`[ExternalAPI] Skipping ${moduleCode}: no semester data`);
    return;
  }

  const recordPayload = {
    ...record,
    prerequisites: record.prerequisites === null ? Prisma.DbNull : record.prerequisites,
  };

  const existingModule = await prisma.module.findFirst({
    where: {
      code: moduleCode,
      semester: normalizedSemester,
    },
  });

  if (existingModule) {
    await prisma.module.updateMany({
      where: {
        code: moduleCode,
        semester: normalizedSemester,
      },
      data: recordPayload,
    });
    result.modulesUpdated++;
  } else {
    await prisma.module.create({
      data: recordPayload,
    });
    result.modulesAdded++;
  }

  if (schedules.length > 0) {
    await processSchedules(moduleCode, schedules);
  }
}

/**
 * Replace module schedules for each index in a semester.
 */
async function processSchedules(
  moduleCode: string,
  schedules: NTUCourseSchedule[]
): Promise<void> {
  const semesterIndexMap = new Map<string, Map<string, NTUCourseSchedule[]>>();

  for (const schedule of schedules) {
    const semester = normalizeSemester(schedule.acadsem);

    if (!semesterIndexMap.has(semester)) {
      semesterIndexMap.set(semester, new Map());
    }
    const indexMap = semesterIndexMap.get(semester)!;

    if (!indexMap.has(schedule.index)) {
      indexMap.set(schedule.index, []);
    }
    indexMap.get(schedule.index)!.push(schedule);
  }

  for (const [semester, indexMap] of semesterIndexMap.entries()) {
    for (const [indexNumber, indexSchedules] of indexMap.entries()) {
      await prisma.index.deleteMany({
        where: {
          moduleCode,
          indexNumber,
          semester,
        },
      });

      const timeSlots = indexSchedules
        .map(schedule => parseTimeSlot(schedule))
        .filter((slot): slot is ParsedTimeSlot => slot !== null);

      const uniqueSlots = new Map<string, ParsedTimeSlot>();
      for (const slot of timeSlots) {
        const key = `${slot.type}-${slot.day}-${slot.startTime}`;
        if (!uniqueSlots.has(key)) {
          uniqueSlots.set(key, slot);
        }
      }

      for (const timeSlot of uniqueSlots.values()) {
        await prisma.index.create({
          data: {
            moduleCode,
            indexNumber,
            semester,
            type: timeSlot.type,
            day: timeSlot.day,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            venue: timeSlot.venue,
            group: timeSlot.group,
            weeks: timeSlot.weeks,
            vacancy: null,
            waitlist: null,
          },
        });
      }
    }
  }
}



