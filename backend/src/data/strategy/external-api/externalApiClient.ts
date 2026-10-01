/**
 * External API client for the NTU course scraper service.
 *
 * Handles pagination, authentication headers, and response normalization.
 */

import { NTUCourseContent, NTUCourseSchedule, NTUExamTimetable } from './types';
import { logger } from '../../../config/logger';

type PaginatedResponse<T> = {
  rows?: T[];
  count?: number;
};

type SemesterRow = { acadsem?: string; value?: string };

/**
 * Client wrapper for the external data source endpoints.
 */
export class ExternalApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  /**
   * @param baseUrl - Base URL for the external API service
   * @param apiKey - Optional API key for authenticated requests
   */
  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Verify connectivity to the external API.
   */
  async testConnection(): Promise<boolean> {
    try {
      // External API health check expects a 200 OK response.
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      logger.error('Failed to connect to external API:', error);
      return false;
    }
  }

  /**
   * Fetch list of available semesters.
   */
  async fetchSemesters(): Promise<string[]> {
    try {
      // External API returns an array of semester rows with `acadsem` or `value`.
      const response = await fetch(`${this.baseUrl}/semesters`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const semesters = Array.isArray(data)
        ? data
          .map((row: unknown) => {
            if (!row || typeof row !== 'object') return null;
            const semesterRow = row as SemesterRow;
            return semesterRow.acadsem || semesterRow.value || null;
          })
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
        : [];

      return [...new Set(semesters)];
    } catch (error: unknown) {
      logger.error('Failed to fetch semesters:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch semesters: ${message}`);
    }
  }

  /**
   * Fetch module metadata records.
   */
  async fetchCourseContent(): Promise<NTUCourseContent[]> {
    logger.info(`[ExternalAPI] Fetching course content from API...`);
    return this.fetchPaged<NTUCourseContent>('course-content', 'course');
  }

  /**
   * Fetch class schedule records.
   */
  async fetchCourseSchedules(): Promise<NTUCourseSchedule[]> {
    logger.info(`[ExternalAPI] Fetching course schedules from API...`);
    return this.fetchPaged<NTUCourseSchedule>('course-schedule', 'schedule');
  }

  /**
   * Fetch exam timetable records.
   */
  async fetchExamTimetable(): Promise<NTUExamTimetable[]> {
    logger.info(`[ExternalAPI] Fetching exam timetable from API...`);
    try {
      return await this.fetchPaged<NTUExamTimetable>('exam-timetable', 'exam');
    } catch (error: unknown) {
      logger.error('Failed to fetch exam timetable:', error);
      logger.warn('[ExternalAPI] Continuing without exam data');
      return [];
    }
  }

  /**
   * Fetch a paginated endpoint in batches until all rows are retrieved.
   */
  private async fetchPaged<T>(endpoint: string, label: string): Promise<T[]> {
    const allRecords: T[] = [];
    const limit = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // External API expects `limit` and `offset` query params for pagination.
      // Response shape: `{ rows: T[], count: number }`.
      const url = `${this.baseUrl}/${endpoint}?limit=${limit}&offset=${offset}`;
      logger.info(`[ExternalAPI] Fetching ${label} batch at offset ${offset}...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = (await response.json()) as PaginatedResponse<T>;
      logger.info(`[ExternalAPI] API returned: rows=${data.rows?.length || 0}, count=${data.count}`);

      if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
        allRecords.push(...data.rows);
        logger.info(`[ExternalAPI] Fetched ${data.rows.length} ${label} records (total: ${allRecords.length})`);

        if (data.count !== undefined && data.count > limit && allRecords.length >= data.count) {
          logger.info(`[ExternalAPI] Reached total count: ${data.count}`);
          hasMore = false;
        } else if (data.rows.length < limit) {
          logger.info(`[ExternalAPI] Received ${data.rows.length} < ${limit}, end of data`);
          hasMore = false;
        } else {
          logger.info('[ExternalAPI] More data available, continuing...');
          offset += limit;
        }
      } else {
        logger.info('[ExternalAPI] No more data available');
        hasMore = false;
      }
    }

    logger.info(`[ExternalAPI] Fetched ${allRecords.length} total ${label} records`);
    return allRecords;
  }

  /**
   * Build request headers for the external API.
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return headers;
  }
}



