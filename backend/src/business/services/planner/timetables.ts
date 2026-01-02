import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { attachYear } from './transform';
import { PlannerSelection } from './types';
import { logger } from '../../../config/logger';

function normalizeName(name: string): string {
  return name.trim();
}

export async function createTimetable(
  userId: string,
  name: string,
  semester: string,
  selections: PlannerSelection[] = [],
  fallbackYear?: number
) {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    throw new AppError(400, 'INVALID_NAME', 'Timetable name is required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const existing = await prisma.timetable.findFirst({
    where: { userId, name: { equals: normalizedName, mode: 'insensitive' } },
  });

  if (existing) {
    throw new AppError(409, 'DUPLICATE_NAME', 'A timetable with this name already exists');
  }

  try {
    const timetable = await prisma.timetable.create({
      data: {
        userId,
        name: normalizedName,
        semester,
        selections,
      },
    });

    return attachYear(timetable, fallbackYear);
  } catch (error: unknown) {
    logger.error('Error creating timetable:', error);
    throw new AppError(500, 'CREATE_TIMETABLE_FAILED', 'Failed to create timetable');
  }
}

export async function getUserTimetables(userId: string) {
  try {
    const timetables = await prisma.timetable.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return timetables.map((timetable) => attachYear(timetable));
  } catch (error: unknown) {
    logger.error('Error fetching timetables:', error);
    throw new AppError(500, 'FETCH_TIMETABLES_FAILED', 'Failed to fetch timetables');
  }
}

export async function getTimetableById(timetableId: string, userId: string) {
  const timetable = await prisma.timetable.findFirst({
    where: { id: timetableId, userId },
  });

  if (!timetable) {
    throw new AppError(404, 'TIMETABLE_NOT_FOUND', 'Timetable not found');
  }

  return attachYear(timetable);
}

export async function updateTimetable(
  timetableId: string,
  userId: string,
  updates: { name?: string; isShared?: boolean; selections?: PlannerSelection[] }
) {
  await getTimetableById(timetableId, userId);

  try {
    const timetable = await prisma.timetable.update({
      where: { id: timetableId },
      data: {
        ...(updates.name ? { name: normalizeName(updates.name) } : {}),
        ...(updates.isShared !== undefined ? { isShared: updates.isShared } : {}),
        ...(updates.selections !== undefined ? { selections: updates.selections } : {}),
      },
    });

    return attachYear(timetable);
  } catch (error: unknown) {
    logger.error('Error updating timetable:', error);
    throw new AppError(500, 'UPDATE_TIMETABLE_FAILED', 'Failed to update timetable');
  }
}

export async function deleteTimetable(timetableId: string, userId: string): Promise<void> {
  await getTimetableById(timetableId, userId);

  try {
    await prisma.timetable.delete({ where: { id: timetableId } });
  } catch (error: unknown) {
    logger.error('Error deleting timetable:', error);
    throw new AppError(500, 'DELETE_TIMETABLE_FAILED', 'Failed to delete timetable');
  }
}



