import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { logger } from '../../../config/logger';

export async function getModuleByCode(code: string) {
  try {
    const module = await prisma.module.findFirst({
      where: { code: code.toUpperCase() },
      orderBy: { semester: 'desc' },
      include: {
        indexes: {
          orderBy: [
            { indexNumber: 'asc' },
            { day: 'asc' },
            { startTime: 'asc' },
          ],
        },
      },
    });

    if (!module) {
      throw new AppError(404, 'MODULE_NOT_FOUND', `Module ${code} not found`);
    }

    return module;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('Error fetching module details:', error);
    throw new AppError(500, 'FETCH_MODULE_FAILED', 'Failed to fetch module details');
  }
}

export async function getModuleIndexes(moduleCode: string, semester?: string) {
  try {
    const whereClause: Prisma.IndexWhereInput = {
      moduleCode: moduleCode.toUpperCase(),
    };

    if (semester) {
      whereClause.semester = semester;
    }

    const indexes = await prisma.index.findMany({
      where: whereClause,
      orderBy: [
        { indexNumber: 'asc' },
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    if (indexes.length === 0) {
      throw new AppError(
        404,
        'NO_INDEXES_FOUND',
        `No indexes found for module ${moduleCode}${semester ? ` in semester ${semester}` : ''}`
      );
    }

    return indexes;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('Error fetching module indexes:', error);
    throw new AppError(500, 'FETCH_INDEXES_FAILED', 'Failed to fetch module indexes');
  }
}

export async function getAvailableSemesters(): Promise<string[]> {
  try {
    const result = await prisma.$queryRaw<Array<{ semester: string }>>`
      SELECT DISTINCT semester
      FROM indexes
      ORDER BY semester DESC
    `;

    const allSemesters = result.map((row) => row.semester);
    const currentYear = new Date().getFullYear();

    return allSemesters.filter((sem) => {
      const year = parseInt(sem.split('_')[0] || '0', 10);
      return year >= currentYear - 1;
    });
  } catch (error: unknown) {
    logger.error('Error fetching available semesters:', error);
    throw new AppError(500, 'FETCH_SEMESTERS_FAILED', 'Failed to fetch available semesters');
  }
}

export async function getCurrentSemester(): Promise<string | null> {
  try {
    const result = await prisma.$queryRaw<Array<{ semester: string }>>`
      SELECT DISTINCT semester
      FROM indexes
      ORDER BY semester DESC
      LIMIT 1
    `;

    const firstResult = result[0];
    return firstResult ? firstResult.semester : null;
  } catch (error: unknown) {
    logger.error('Error fetching current semester:', error);
    throw new AppError(500, 'FETCH_CURRENT_SEMESTER_FAILED', 'Failed to fetch current semester');
  }
}

export async function getSchools(): Promise<string[]> {
  try {
    const result = await prisma.module.findMany({
      select: { school: true },
      distinct: ['school'],
      orderBy: { school: 'asc' },
    });

    return result.map((r) => r.school);
  } catch (error: unknown) {
    logger.error('Error fetching schools:', error);
    throw new AppError(500, 'FETCH_SCHOOLS_FAILED', 'Failed to fetch schools');
  }
}