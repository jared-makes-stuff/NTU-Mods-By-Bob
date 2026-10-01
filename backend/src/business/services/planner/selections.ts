import { AppError } from '../../../api/middleware/error.middleware';
import { getTimetableById, updateTimetable } from './timetables';
import { PlannerModuleSelection, PlannerSelection } from './types';

export async function addModuleToTimetable(
  timetableId: string,
  userId: string,
  selection: PlannerModuleSelection
) {
  try {
    if (!selection.moduleCode) {
      throw new AppError(400, 'INVALID_MODULE', 'Module code is required');
    }

    const timetable = await getTimetableById(timetableId, userId);
    const currentSelections = Array.isArray(timetable.selections)
      ? (timetable.selections as PlannerSelection[])
      : [];

    const existingIndex = currentSelections.findIndex(
      (entry) => entry.moduleCode === selection.moduleCode
    );

    const newSelections = [...currentSelections];
    if (existingIndex >= 0) {
      newSelections[existingIndex] = selection;
    } else {
      newSelections.push(selection);
    }

    return await updateTimetable(timetableId, userId, { selections: newSelections });
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'ADD_MODULE_FAILED', 'Failed to add module');
  }
}

export async function removeModuleFromTimetable(
  timetableId: string,
  userId: string,
  moduleCode: string
 ) {
  try {
    const timetable = await getTimetableById(timetableId, userId);
    const currentSelections = Array.isArray(timetable.selections)
      ? (timetable.selections as PlannerSelection[])
      : [];
    const newSelections = currentSelections.filter((entry) => entry.moduleCode !== moduleCode);

    return await updateTimetable(timetableId, userId, { selections: newSelections });
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'REMOVE_MODULE_FAILED', 'Failed to remove module');
  }
}
