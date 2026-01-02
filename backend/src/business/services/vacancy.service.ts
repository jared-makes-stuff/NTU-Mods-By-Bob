/**
 * Vacancy Service
 *
 * Fetches course vacancy information from the NTU public API.
 */

import axios from 'axios';
import { isServiceAvailable } from './vacancy/availability';
import { VacancyCache } from './vacancy/cache';
import { parseVacancyHtml } from './vacancy/parser';
import { ClassSession, IndexVacancy, SingleIndexResult, VacancyResult } from './vacancy/types';
import { logger } from '../../config/logger';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

class VacancyService {
  private baseUrl = 'https://wish.wis.ntu.edu.sg/webexe/owa/aus_vacancy.check_vacancy2';
  private timeout = 10000;
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': 'https://wish.wis.ntu.edu.sg/webexe/owa/aus_vacancy.check_vacancy',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  private cache = new VacancyCache(env.VACANCY_CACHE_TTL_SECONDS * 1000);
  private cacheTtlMs = env.VACANCY_CACHE_TTL_SECONDS * 1000;

  private buildClassSession(row: {
    type: string;
    group: string | null;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    weeks: number[];
  }): ClassSession {
    return {
      type: row.type,
      group: row.group ?? '',
      day: row.day,
      time: `${row.startTime}-${row.endTime}`,
      venue: row.venue,
      remark: row.weeks?.length ? `Wk${row.weeks.join(',')}` : undefined,
    };
  }

  private async getCachedCourseVacancies(courseCode: string, cutoff?: Date): Promise<IndexVacancy[] | null> {
    try {
      const rows = await prisma.index.findMany({
        where: {
          moduleCode: courseCode.toUpperCase(),
          vacancy: { not: null },
          ...(cutoff ? { updatedAt: { gte: cutoff } } : {}),
        },
        select: {
          indexNumber: true,
          vacancy: true,
          waitlist: true,
          type: true,
          group: true,
          day: true,
          startTime: true,
          endTime: true,
          venue: true,
          weeks: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (rows.length === 0) {
        return null;
      }

      const grouped = new Map<string, { vacancy: number; waitlist: number; classes: ClassSession[] }>();
      rows.forEach((row) => {
        const indexKey = row.indexNumber;
        if (!grouped.has(indexKey)) {
          grouped.set(indexKey, {
            vacancy: row.vacancy ?? 0,
            waitlist: row.waitlist ?? 0,
            classes: [],
          });
        }
        grouped.get(indexKey)!.classes.push(this.buildClassSession(row));
      });

      return Array.from(grouped.entries()).map(([index, data]) => ({
        index,
        vacancy: data.vacancy,
        waitlist: data.waitlist,
        classes: data.classes,
      }));
    } catch (error) {
      logger.warn('[Vacancy] Failed to read cached course vacancies', { courseCode, error });
      return null;
    }
  }

  private async getCachedIndexVacancy(
    courseCode: string,
    indexNumber: string,
    cutoff?: Date
  ): Promise<IndexVacancy | null> {
    try {
      const rows = await prisma.index.findMany({
        where: {
          moduleCode: courseCode.toUpperCase(),
          indexNumber,
          vacancy: { not: null },
          ...(cutoff ? { updatedAt: { gte: cutoff } } : {}),
        },
        select: {
          indexNumber: true,
          vacancy: true,
          waitlist: true,
          type: true,
          group: true,
          day: true,
          startTime: true,
          endTime: true,
          venue: true,
          weeks: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (rows.length === 0) {
        return null;
      }

      return {
        index: rows[0]!.indexNumber,
        vacancy: rows[0]!.vacancy ?? 0,
        waitlist: rows[0]!.waitlist ?? 0,
        classes: rows.map((row) => this.buildClassSession(row)),
      };
    } catch (error) {
      logger.warn('[Vacancy] Failed to read cached index vacancy', {
        courseCode,
        indexNumber,
        error,
      });
      return null;
    }
  }

  private async updateIndexCache(courseCode: string, indexes: IndexVacancy[]): Promise<void> {
    if (indexes.length === 0) return;

    const now = new Date();
    const updates = indexes.map((index) =>
      prisma.index.updateMany({
        where: {
          moduleCode: courseCode.toUpperCase(),
          indexNumber: index.index,
        },
        data: {
          vacancy: index.vacancy,
          waitlist: index.waitlist,
          lastVacancyCheckAt: now,
          updatedAt: now,
        },
      })
    );
    try {
      await prisma.$transaction(updates);
    } catch (error) {
      logger.warn('[Vacancy] Failed to update index cache', {
        courseCode,
        error,
      });
    }
  }

  async getCourseVacancies(courseCode: string): Promise<VacancyResult> {
    try {
      const cutoff = new Date(Date.now() - this.cacheTtlMs);
      const dbCached = await this.getCachedCourseVacancies(courseCode, cutoff);
      if (dbCached) {
        this.cache.set(courseCode, dbCached);
        return { success: true, data: dbCached };
      }

      const cachedData = this.cache.get(courseCode);
      if (cachedData) {
        return { success: true, data: cachedData };
      }

      const { available, message } = isServiceAvailable();
      if (!available) {
        const staleCache = this.cache.getStale(courseCode);
        if (staleCache) {
          return { success: true, data: staleCache };
        }
        const staleDbCache = await this.getCachedCourseVacancies(courseCode);
        if (staleDbCache) {
          return { success: true, data: staleDbCache };
        }

        return {
          success: false,
          error: 'time_restriction',
          errorMessage: message,
        };
      }

      // NTU vacancy endpoint expects `subj=<MODULE_CODE>` form data.
      const response = await axios.post(
        this.baseUrl,
        `subj=${courseCode.toUpperCase()}`,
        {
          headers: this.headers,
          timeout: this.timeout,
        }
      );

      if (response.status !== 200) {
        let errorMsg = `Server Error (Status ${response.status})`;
        if (response.status === 503) {
          errorMsg += ' - Service Unavailable';
        } else if (response.status === 500) {
          errorMsg += ' - Internal Server Error';
        } else if (response.status === 403) {
          errorMsg += ' - Access Forbidden';
        } else if (response.status === 404) {
          errorMsg += ' - Endpoint Not Found';
        }

        const staleCache = this.cache.getStale(courseCode);
        if (staleCache) {
          return { success: true, data: staleCache };
        }

        return {
          success: false,
          error: 'http_error',
          errorMessage: errorMsg,
          statusCode: response.status,
        };
      }

      const indexes = parseVacancyHtml(response.data, courseCode);

      if (indexes === null) {
        const staleCache = this.cache.getStale(courseCode);
        if (staleCache) {
          return { success: true, data: staleCache };
        }

        return {
          success: false,
          error: 'parse_error',
          errorMessage: 'Failed to parse response from server',
        };
      }

      this.cache.set(courseCode, indexes);
      await this.updateIndexCache(courseCode, indexes);

      return {
        success: true,
        data: indexes,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = isRecord(error) && typeof error.code === 'string' ? error.code : undefined;
      const staleCache = this.cache.getStale(courseCode);
      if (staleCache) {
        return { success: true, data: staleCache };
      }

      if (errorCode === 'ECONNABORTED' || errorCode === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'timeout',
          errorMessage: 'Request Timeout - Server took too long to respond',
        };
      }

      if (errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'connection_error',
          errorMessage: 'Connection Error - Unable to reach NTU server. Check your internet connection.',
        };
      }

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: 'request_error',
          errorMessage: `Network Error - ${error.message}`,
        };
      }

      return {
        success: false,
        error: 'unknown_error',
        errorMessage: `Unexpected Error - ${errorMessage}`,
      };
    }
  }

  async getIndexVacancy(courseCode: string, indexNumber: string): Promise<SingleIndexResult> {
    try {
      const cutoff = new Date(Date.now() - this.cacheTtlMs);
      const cached = await this.getCachedIndexVacancy(courseCode, indexNumber, cutoff);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }

      const result = await this.getCourseVacancies(courseCode);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          errorMessage: result.errorMessage,
        };
      }

      const allIndexes = result.data || [];
      const found = allIndexes.find((indexInfo) => indexInfo.index === indexNumber);

      if (!found) {
        return {
          success: false,
          error: 'index_not_found',
          errorMessage: `Index ${indexNumber} not found for course ${courseCode}`,
        };
      }

      return {
        success: true,
        data: found,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: 'unknown_error',
        errorMessage: `Error: ${errorMessage}`,
      };
    }
  }

  getCacheStats() {
    return this.cache.stats();
  }

  clearCache() {
    const size = this.cache.clear();
    logger.info(`Cleared ${size} cached entries`);
  }

  /**
   * Get module vacancies - simplified version for scheduler
   * Returns only vacancy/waitlist data without class details
   */
  async getModuleVacancies(
    moduleCode: string
  ): Promise<{ success: true; data: Array<{ indexNumber: string; vacancy: number; waitlist: number }> } | { success: false; error: string; errorMessage: string }> {
    const result = await this.getCourseVacancies(moduleCode);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'unknown_error',
        errorMessage: result.errorMessage ?? 'Unknown error occurred',
      };
    }

    const data = (result.data || []).map((index) => ({
      indexNumber: index.index,
      vacancy: index.vacancy,
      waitlist: index.waitlist,
    }));

    return {
      success: true,
      data,
    };
  }
}

export const vacancyService = new VacancyService();



