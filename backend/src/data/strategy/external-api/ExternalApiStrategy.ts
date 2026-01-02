/**
 * External API Data Source Strategy
 *
 * Orchestrates fetching, transforming, and persisting module data
 * from the NTU Course Scraper API.
 */

import { IDataSourceStrategy } from '../../interfaces/IDataSourceStrategy';
import { SyncResult } from '../../../types/domain';
import { env } from '../../../config/env';
import { ExternalApiClient } from './externalApiClient';
import { groupExamData, groupSchedules } from './externalApiGrouping';
import { processModule } from './externalApiPersistence';
import { normalizeSemester } from './externalApiParser';
import { logger } from '../../../config/logger';

export class ExternalApiStrategy implements IDataSourceStrategy {
  private readonly client: ExternalApiClient;

  constructor() {
    const baseUrl = env.EXTERNAL_API_URL || 'http://192.168.1.30:3000';
    this.client = new ExternalApiClient(baseUrl, env.EXTERNAL_API_KEY);
  }

  getName(): string {
    return 'ExternalAPI';
  }

  /**
   * Ping the external service to validate connectivity.
   */
  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  /**
   * Sync modules, schedules, and exam data into the database.
   */
  async syncModules(): Promise<SyncResult> {
    logger.info(`[${this.getName()}] Starting module synchronization...`);

    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      modulesAdded: 0,
      modulesUpdated: 0,
      modulesDeleted: 0,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to external API');
      }

      logger.info(`[${this.getName()}] Fetching available semesters...`);
      const semesters = await this.client.fetchSemesters();
      logger.info(`[${this.getName()}] Found ${semesters.length} semesters`);

      logger.info(`[${this.getName()}] Fetching course content...`);
      const courseContent = await this.client.fetchCourseContent();
      logger.info(`[${this.getName()}] Fetched ${courseContent.length} course records`);

      logger.info(`[${this.getName()}] Fetching course schedules...`);
      const courseSchedules = await this.client.fetchCourseSchedules();
      logger.info(`[${this.getName()}] Fetched ${courseSchedules.length} schedule records`);

      logger.info(`[${this.getName()}] Fetching exam timetable...`);
      const examTimetable = await this.client.fetchExamTimetable();
      logger.info(`[${this.getName()}] Fetched ${examTimetable.length} exam records`);

      const schedulesMap = groupSchedules(courseSchedules);
      const examMap = groupExamData(examTimetable);

      for (const course of courseContent) {
        try {
          const normalizedSemester = course.acadsem
            ? normalizeSemester(course.acadsem)
            : null;
          const scheduleKey = normalizedSemester
            ? `${course.course_code}_${normalizedSemester}`
            : `${course.course_code}_${course.acadsem}`;
          const schedules = schedulesMap.get(scheduleKey) || [];
          const examData = examMap.get(course.course_code);
          await processModule(course, schedules, examData, result);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to process ${course.course_code}: ${errorMessage}`);
          logger.error(`[${this.getName()}] Error processing ${course.course_code}:`, error);
        }
      }

      result.success = true;
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`[${this.getName()}] Sync completed in ${duration}s`);
      logger.info(
        `[${this.getName()}] Added: ${result.modulesAdded}, Updated: ${result.modulesUpdated}`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(`Sync failed: ${errorMessage}`);
      logger.error(`[${this.getName()}] Sync failed:`, error);
    }

    return result;
  }
}



