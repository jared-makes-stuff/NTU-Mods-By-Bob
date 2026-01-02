import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { logger } from '../../../config/logger';

type SearchableModule = {
  code: string;
  name?: string | null;
  description?: string | null;
};

function rankBySearchTerm<T extends SearchableModule>(searchTerm: string) {
  const search = searchTerm.toLowerCase();
  return (a: T, b: T) => {
    const aCode = a.code.toLowerCase();
    const bCode = b.code.toLowerCase();

    if (aCode === search && bCode !== search) return -1;
    if (bCode === search && aCode !== search) return 1;

    if (aCode.startsWith(search) && !bCode.startsWith(search)) return -1;
    if (bCode.startsWith(search) && !aCode.startsWith(search)) return 1;

    const aCodeContains = aCode.includes(search);
    const bCodeContains = bCode.includes(search);
    if (aCodeContains && !bCodeContains) return -1;
    if (bCodeContains && !aCodeContains) return 1;

    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();
    const aNameContains = aName.includes(search);
    const bNameContains = bName.includes(search);
    if (aNameContains && !bNameContains) return -1;
    if (bNameContains && !aNameContains) return 1;

    const aDesc = (a.description || '').toLowerCase();
    const bDesc = (b.description || '').toLowerCase();
    const aDescContains = aDesc.includes(search);
    const bDescContains = bDesc.includes(search);
    if (aDescContains && !bDescContains) return -1;
    if (bDescContains && !aDescContains) return 1;

    return aCode.localeCompare(bCode);
  };
}

export async function searchModules(query: string, limit: number = 10, semester?: string) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();

    const modules = await prisma.module.findMany({
      where: {
        AND: [
          {
            OR: [
              { code: { equals: searchTerm, mode: 'insensitive' } },
              { code: { contains: searchTerm, mode: 'insensitive' } },
              { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          ...(semester ? [{ semester }] : []),
        ],
      },
      select: {
        code: true,
        semester: true,
        name: true,
        au: true,
        school: true,
        description: true,
        examDateTime: true,
        examDuration: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ code: 'asc' }, { semester: 'desc' }],
    });

    if (semester) {
      const sortedModules = modules.sort(rankBySearchTerm(searchTerm));
      return sortedModules.slice(0, limit);
    }

    const latestByCode = new Map<string, typeof modules[number]>();
    for (const module of modules) {
      if (!latestByCode.has(module.code)) {
        latestByCode.set(module.code, module);
      }
    }

    const uniqueModules = Array.from(latestByCode.values());
    const sortedModules = uniqueModules.sort(rankBySearchTerm(searchTerm));
    return sortedModules.slice(0, limit);
  } catch (error: unknown) {
    logger.error('Error searching modules:', error);
    throw new AppError(500, 'SEARCH_MODULES_FAILED', 'Failed to search modules');
  }
}

export async function searchModulesAll(query: string, limit: number = 10) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();
    const modules = await prisma.module.findMany({
      where: {
        OR: [
          { code: { equals: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit * 2,
      select: {
        code: true,
        name: true,
        au: true,
        school: true,
        description: true,
        examDuration: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const sortedModules = modules.sort(rankBySearchTerm(searchTerm));
    return sortedModules.slice(0, limit);
  } catch (error: unknown) {
    logger.error('Error searching all modules:', error);
    throw new AppError(500, 'SEARCH_ALL_MODULES_FAILED', 'Failed to search modules');
  }
}



