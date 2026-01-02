import { prisma } from '../../../../config/database';
import { ClassItem, ModuleForGeneration, ModuleWithIndexes } from './types';
import { logger } from '../../../../config/logger';

export async function fetchModulesWithIndexes(
  modules: ModuleForGeneration[],
  semester: string
): Promise<ModuleWithIndexes[]> {
  const modulesWithIndexes: ModuleWithIndexes[] = [];

  for (const moduleRequest of modules) {
    const moduleInfo = await prisma.module.findUnique({
      where: {
        code_semester: {
          code: moduleRequest.code,
          semester,
        },
      },
    });

    if (!moduleInfo) {
      logger.warn(
        `[TimetableController] Module ${moduleRequest.code} not found for semester ${semester}`
      );
      continue;
    }

    const indexRecords = await prisma.index.findMany({
      where: {
        moduleCode: moduleRequest.code,
        semester,
        indexNumber: {
          in: moduleRequest.indexNumbers,
        },
      },
      orderBy: [
        { indexNumber: 'asc' },
        { type: 'asc' },
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    if (indexRecords.length === 0) {
      logger.warn(`[TimetableController] No indexes found for module ${moduleRequest.code}`);
      continue;
    }

    const indexMap = new Map<string, ClassItem[]>();
    indexRecords.forEach(record => {
      if (!indexMap.has(record.indexNumber)) {
        indexMap.set(record.indexNumber, []);
      }
      indexMap.get(record.indexNumber)!.push({
        type: record.type,
        day: record.day,
        startTime: record.startTime,
        endTime: record.endTime,
        venue: record.venue,
        weeks: record.weeks,
      });
    });

    const indexes = Array.from(indexMap.entries()).map(([indexNumber, classes]) => ({
      indexNumber,
      classes,
    }));

    modulesWithIndexes.push({
      code: moduleInfo.code,
      name: moduleInfo.name,
      au: moduleInfo.au,
      indexes,
    });
  }

  return modulesWithIndexes;
}



