import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { normalizeModuleCode } from './helpers';
import { logger } from '../../../config/logger';

export async function getModuleTopics(moduleCode: string) {
  try {
    const topics = await prisma.moduleTopic.findMany({
      where: {
        moduleCode: normalizeModuleCode(moduleCode),
        parentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          include: {
            children: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return topics;
  } catch (error: unknown) {
    logger.error('Error fetching module topics:', error);
    throw new AppError(500, 'FETCH_TOPICS_FAILED', 'Failed to fetch topics');
  }
}



