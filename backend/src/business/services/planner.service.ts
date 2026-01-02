/**
 * Planner Service
 *
 * Relational implementation backed by Timetable table.
 */

import {
  createTimetable,
  deleteTimetable,
  getTimetableById,
  getUserTimetables,
  updateTimetable,
} from './planner/timetables';
import { addModuleToTimetable, removeModuleFromTimetable } from './planner/selections';
import { detectTimetableConflicts } from './planner/conflicts';
import { generatePlannerTimetables, PlannerGenerationConstraints } from './planner/generation';
import { PlannerModuleSelection, PlannerSelection } from './planner/types';

export class PlannerService {
  async createTimetable(
    userId: string,
    name: string,
    semester: string,
    year?: number,
    selections: PlannerSelection[] = []
  ): ReturnType<typeof createTimetable> {
    return createTimetable(userId, name, semester, selections, year);
  }

  async getUserTimetables(userId: string): ReturnType<typeof getUserTimetables> {
    return getUserTimetables(userId);
  }

  async getTimetableById(timetableId: string | number, userId: string): ReturnType<typeof getTimetableById> {
    return getTimetableById(timetableId.toString(), userId);
  }

  async updateTimetable(
    timetableId: string | number,
    userId: string,
    updates: { name?: string; isShared?: boolean; selections?: PlannerSelection[] }
  ): ReturnType<typeof updateTimetable> {
    return updateTimetable(timetableId.toString(), userId, updates);
  }

  async deleteTimetable(timetableId: string | number, userId: string): Promise<void> {
    return deleteTimetable(timetableId.toString(), userId);
  }

  async addModuleToTimetable(
    timetableId: string | number,
    userId: string,
    selection: PlannerModuleSelection
  ): ReturnType<typeof addModuleToTimetable> {
    return addModuleToTimetable(timetableId.toString(), userId, selection);
  }

  async removeModuleFromTimetable(
    timetableId: string | number,
    userId: string,
    moduleCode: string
  ): ReturnType<typeof removeModuleFromTimetable> {
    return removeModuleFromTimetable(timetableId.toString(), userId, moduleCode);
  }

  async detectConflicts(timetableId: string | number, userId: string): ReturnType<typeof detectTimetableConflicts> {
    return detectTimetableConflicts(timetableId.toString(), userId);
  }

  async generateTimetables(userId: string, constraints: PlannerGenerationConstraints): ReturnType<typeof generatePlannerTimetables> {
    void userId;
    return generatePlannerTimetables(constraints);
  }
}

export const plannerService = new PlannerService();
