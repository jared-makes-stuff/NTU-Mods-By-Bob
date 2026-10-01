import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { hasPrerequisiteCode } from './prerequisites';
import { logger } from '../../../config/logger';

export async function getModuleStats(): Promise<{
  totalModules: number;
  totalIndexes: number;
  avgAcademicUnits: number;
  modulesWithPrerequisites: number;
}> {
  try {
    const [totalModules, totalIndexes, modulesData, prereqCount] = await Promise.all([
      prisma.module.count(),
      prisma.index.count(),
      prisma.module.findMany({
        select: { au: true },
      }),
      prisma.module.count({
        where: { prerequisites: { not: Prisma.DbNull } },
      }),
    ]);

    const totalAU = modulesData.reduce((sum, module) => sum + module.au, 0);
    const avgAcademicUnits = modulesData.length > 0 ? totalAU / modulesData.length : 0;

    return {
      totalModules,
      totalIndexes,
      avgAcademicUnits: Math.round(avgAcademicUnits * 10) / 10,
      modulesWithPrerequisites: prereqCount,
    };
  } catch (error: unknown) {
    logger.error('Error fetching module stats:', error);
    throw new AppError(500, 'FETCH_MODULE_STATS_FAILED', 'Failed to fetch module stats');
  }
}

export async function getModuleDependencies(code: string): Promise<string[]> {
  try {
    const moduleCode = code.toUpperCase();
    const modules = await prisma.module.findMany({
      select: {
        code: true,
        prerequisites: true,
      },
    });

    return modules
      .filter((module) => hasPrerequisiteCode(module.prerequisites, moduleCode))
      .map((module) => module.code);
  } catch (error: unknown) {
    logger.error('Error fetching dependencies:', error);
    throw new AppError(500, 'FETCH_DEPENDENCIES_FAILED', 'Failed to fetch dependencies');
  }
}



