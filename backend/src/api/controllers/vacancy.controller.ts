/**
 * Vacancy Controller
 * 
 * Handles HTTP requests for course vacancy information endpoints.
 * Uses public NTU API (no authentication required).
 */

import { Request, Response } from 'express';
import { vacancyService } from '../../business/services/vacancy.service';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../../config/logger';

/**
 * VacancyController class
 * Contains all vacancy route handlers
 */
export class VacancyController {
  /**
   * GET /api/vacancy/course/:courseCode
   * Get vacancy information for all indexes of a course
   * 
   * Params:
   * - courseCode: string (e.g., 'SC2103', 'CZ2006')
   * 
   * Response: 200 OK
   * - success: boolean
   * - data: Array of index vacancy information
   * 
   * Example response:
   * {
   *   "data": {
   *     "success": true,
   *     "data": [
   *       {
   *         "index": "10294",
   *         "vacancy": 5,
   *         "waitlist": 0,
   *         "classes": [
   *           {
   *             "type": "LEC",
   *             "group": "LE1",
   *             "day": "MON",
   *             "time": "0830-1030",
   *             "venue": "LT1A",
   *             "remark": "Teaching Wk1-13"
   *           }
   *         ]
   *       }
   *     ]
   *   }
   * }
   */
  getCourseVacancies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseCode } = req.params;

    if (!courseCode) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Course code is required'
      });
      return;
    }

    logger.info(`[Vacancy] Request for course: ${courseCode}`);

    const result = await vacancyService.getCourseVacancies(courseCode);

    if (!result.success) {
      // Determine appropriate HTTP status code
      let statusCode = 500;
      if (result.error === 'time_restriction') {
        statusCode = 503; // Service Unavailable
      } else if (result.error === 'parse_error') {
        statusCode = 502; // Bad Gateway
      } else if (result.error === 'timeout' || result.error === 'connection_error') {
        statusCode = 504; // Gateway Timeout
      }

      res.status(statusCode).json({
        error: result.error,
        message: result.errorMessage
      });
      return;
    }

    res.status(200).json({
      data: result
    });
  });

  /**
   * GET /api/vacancy/course/:courseCode/index/:indexNumber
   * Get vacancy information for a specific index
   * 
   * Params:
   * - courseCode: string (e.g., 'SC2103')
   * - indexNumber: string (e.g., '10294')
   * 
   * Response: 200 OK
   * - success: boolean
   * - data: Index vacancy information
   */
  getIndexVacancy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseCode, indexNumber } = req.params;

    if (!courseCode || !indexNumber) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Course code and index number are required'
      });
      return;
    }

    logger.info(`[Vacancy] Request for ${courseCode}/${indexNumber}`);

    const result = await vacancyService.getIndexVacancy(courseCode, indexNumber);

    if (!result.success) {
      // Determine appropriate HTTP status code
      let statusCode = 500;
      if (result.error === 'time_restriction') {
        statusCode = 503;
      } else if (result.error === 'index_not_found') {
        statusCode = 404;
      } else if (result.error === 'parse_error') {
        statusCode = 502;
      } else if (result.error === 'timeout' || result.error === 'connection_error') {
        statusCode = 504;
      }

      res.status(statusCode).json({
        error: result.error,
        message: result.errorMessage
      });
      return;
    }

    res.status(200).json({
      data: result
    });
  });
}

export const vacancyController = new VacancyController();



