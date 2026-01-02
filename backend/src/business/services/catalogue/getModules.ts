import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { buildModuleWhere, resolveModuleCodeFilter } from './filters';
import { ModuleFilters, PaginationParams, PaginatedResponse } from './types';
import { logger } from '../../../config/logger';

const moduleInclude = {
  indexes: {
    select: {
      indexNumber: true,
      type: true,
      day: true,
      startTime: true,
      endTime: true,
      venue: true,
      group: true,
      weeks: true,
      vacancy: true,
      waitlist: true,
    },
  },
} satisfies Prisma.ModuleInclude;

type ModuleWithIndexes = Prisma.ModuleGetPayload<{
  include: typeof moduleInclude;
}>;

export async function getModules(
  filters: ModuleFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<ModuleWithIndexes>> {
  try {
    const { codes, earlyReturn } = await resolveModuleCodeFilter(filters);

    if (earlyReturn) {
      return {
        data: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const where = buildModuleWhere(filters, codes);
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    // If there's a search query, we'll sort by relevance after fetching
    const hasSearchQuery = filters.search && filters.search.trim().length > 0;
    
    const sortBy = pagination.sortBy && ['code', 'name', 'au'].includes(pagination.sortBy)
      ? pagination.sortBy
      : 'code';
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [sortBy]: pagination.sortOrder || 'asc',
    };

    const [modules, total] = await Promise.all([
      prisma.module.findMany({
        where,
        skip: hasSearchQuery ? undefined : skip,
        take: hasSearchQuery ? undefined : take,
        orderBy: hasSearchQuery ? { code: 'asc' } : orderBy,
        include: moduleInclude,
      }),
      prisma.module.count({ where }),
    ]);

    // If there's a search query, sort by relevance and then paginate
    let sortedModules = modules;
    if (hasSearchQuery && filters.search) {
      const searchTerm = filters.search.toLowerCase();
      sortedModules = modules.sort((a, b) => {
        const aCode = a.code.toLowerCase();
        const bCode = b.code.toLowerCase();
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();

        // Exact code match
        if (aCode === searchTerm && bCode !== searchTerm) return -1;
        if (bCode === searchTerm && aCode !== searchTerm) return 1;

        // Code starts with search term
        if (aCode.startsWith(searchTerm) && !bCode.startsWith(searchTerm)) return -1;
        if (bCode.startsWith(searchTerm) && !aCode.startsWith(searchTerm)) return 1;

        // Code contains search term
        const aCodeContains = aCode.includes(searchTerm);
        const bCodeContains = bCode.includes(searchTerm);
        if (aCodeContains && !bCodeContains) return -1;
        if (bCodeContains && !aCodeContains) return 1;

        // Name contains search term
        const aNameContains = aName.includes(searchTerm);
        const bNameContains = bName.includes(searchTerm);
        if (aNameContains && !bNameContains) return -1;
        if (bNameContains && !aNameContains) return 1;

        // Default to code alphabetical order
        return aCode.localeCompare(bCode);
      });

      // Apply pagination after sorting
      sortedModules = sortedModules.slice(skip, skip + take);
    }

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: sortedModules,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error: unknown) {
    logger.error('Error fetching modules:', error);
    throw new AppError(500, 'FETCH_MODULES_FAILED', 'Failed to fetch modules');
  }
}



