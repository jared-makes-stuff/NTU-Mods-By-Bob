/**
 * Catalogue Service
 *
 * Read-only access to module catalogue data synced from the external API.
 * Implementation is split into small modules under ./catalogue/.
 */

import { prisma } from '../../config/database';
import { AppError } from '../../api/middleware/error.middleware';
import { getModules } from './catalogue/getModules';
import { getAvailableSemesters, getCurrentSemester, getModuleByCode, getModuleIndexes, getSchools } from './catalogue/lookup';
import { searchModules, searchModulesAll } from './catalogue/search';
import { getModuleDependencies, getModuleStats } from './catalogue/stats';
import { ModuleFilters, PaginationParams } from './catalogue/types';
import { logger } from '../../config/logger';
import { buildCacheKey, getOrSetCache, hashCacheKey } from '../../config/cache';
import { env } from '../../config/env';

const CACHE_NAMESPACE = 'catalogue';
const DEFAULT_TTL = env.CACHE_DEFAULT_TTL_SECONDS;
const SEARCH_TTL = Math.min(DEFAULT_TTL, 300);

export class CatalogueService {
  async getModules(
    filters: ModuleFilters,
    pagination: PaginationParams
  ): ReturnType<typeof getModules> {
    const cacheKey = hashCacheKey(CACHE_NAMESPACE, {
      type: 'modules',
      filters,
      pagination,
    });

    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getModules(filters, pagination));
  }

  async getModuleByCode(code: string): ReturnType<typeof getModuleByCode> {
    const normalizedCode = code.toUpperCase();
    const cacheKey = buildCacheKey(CACHE_NAMESPACE, `module:${normalizedCode}`);
    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getModuleByCode(code));
  }

  async searchModules(query: string, limit: number = 10, semester?: string): ReturnType<typeof searchModules> {
    const cacheKey = hashCacheKey(CACHE_NAMESPACE, {
      type: 'search',
      query,
      limit,
      semester,
    });
    return getOrSetCache(cacheKey, SEARCH_TTL, () => searchModules(query, limit, semester));
  }

  async searchModulesAll(query: string, limit: number = 10): ReturnType<typeof searchModulesAll> {
    const cacheKey = hashCacheKey(CACHE_NAMESPACE, {
      type: 'search-all',
      query,
      limit,
    });
    return getOrSetCache(cacheKey, SEARCH_TTL, () => searchModulesAll(query, limit));
  }

  async getAvailableSemesters(): Promise<string[]> {
    const cacheKey = buildCacheKey(CACHE_NAMESPACE, 'semesters');
    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getAvailableSemesters());
  }

  async getCurrentSemester(): Promise<string | null> {
    const cacheKey = buildCacheKey(CACHE_NAMESPACE, 'current-semester');
    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getCurrentSemester());
  }

  async getSchools(): Promise<string[]> {
    const cacheKey = buildCacheKey(CACHE_NAMESPACE, 'schools');
    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getSchools());
  }

  async getModuleIndexes(moduleCode: string, semester?: string): ReturnType<typeof getModuleIndexes> {
    const normalizedCode = moduleCode.toUpperCase();
    const cacheKey = hashCacheKey(CACHE_NAMESPACE, {
      type: 'indexes',
      moduleCode: normalizedCode,
      semester,
    });
    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getModuleIndexes(moduleCode, semester));
  }

  async checkPrerequisites(moduleCode: string): Promise<{
    hasPrerequisites: boolean;
    prerequisites: unknown;
  }> {
    try {
      const normalizedCode = moduleCode.toUpperCase();
      const cacheKey = buildCacheKey(CACHE_NAMESPACE, `prereq:${normalizedCode}`);

      return await getOrSetCache(cacheKey, DEFAULT_TTL, async () => {
        const module = await prisma.module.findFirst({
          where: { code: normalizedCode },
          orderBy: { semester: 'desc' },
          select: { prerequisites: true },
        });

        if (!module) {
          throw new AppError(404, 'MODULE_NOT_FOUND', `Module ${moduleCode} not found`);
        }

        return {
          hasPrerequisites: module.prerequisites !== null,
          prerequisites: module.prerequisites,
        };
      });
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error('Error checking prerequisites:', error);
      throw new AppError(500, 'CHECK_PREREQUISITES_FAILED', 'Failed to check prerequisites');
    }
  }

  async getModuleStats(): ReturnType<typeof getModuleStats> {
    const cacheKey = buildCacheKey(CACHE_NAMESPACE, 'stats');
    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getModuleStats());
  }

  async getModuleDependencies(code: string): ReturnType<typeof getModuleDependencies> {
    const normalizedCode = code.toUpperCase();
    const cacheKey = buildCacheKey(CACHE_NAMESPACE, `dependencies:${normalizedCode}`);
    return getOrSetCache(cacheKey, DEFAULT_TTL, () => getModuleDependencies(code));
  }
}

export const catalogueService = new CatalogueService();



