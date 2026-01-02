/**
 * Vacancy API Service
 * 
 * Handles course vacancy information retrieval from NTU public API
 * No authentication required
 */

import axios from 'axios';
import { apiClient } from './client';
import { parseDataResponse } from './validation';
import { singleVacancyResultSchema, vacancyResultSchema } from './schemas';

export interface ClassSession {
  type: string;
  group: string;
  day: string;
  time: string;
  venue: string;
  remark?: string;
}

export interface IndexVacancy {
  index: string;
  vacancy: number;
  waitlist: number;
  classes: ClassSession[];
}

export interface VacancyResult {
  success: boolean;
  data?: IndexVacancy[];
  error?: string;
  errorMessage?: string;
  statusCode?: number;
}

export interface SingleIndexResult {
  success: boolean;
  data?: IndexVacancy;
  error?: string;
  errorMessage?: string;
}

/**
 * Get vacancy information for all indexes of a course
 * GET /api/vacancy/course/:courseCode
 * 
 * @param courseCode - Course code (e.g., 'SC2103', 'CZ2006')
 * @returns Promise with vacancy result
 */
export async function getCourseVacancies(courseCode: string): Promise<VacancyResult> {
  try {
    const response = await apiClient.get(`/vacancy/course/${courseCode}`);
    return parseDataResponse(vacancyResultSchema, response.data, 'Course vacancies');
  } catch (error: unknown) {
    // Handle error responses
    if (axios.isAxiosError(error) && error.response?.data) {
      const payload = error.response.data as { error?: string; message?: string };
      return {
        success: false,
        error: payload.error || 'unknown_error',
        errorMessage: payload.message || 'Failed to fetch vacancies',
        statusCode: error.response.status
      };
    }
    
    return {
      success: false,
      error: 'network_error',
      errorMessage: 'Failed to connect to server',
    };
  }
}

/**
 * Get vacancy information for a specific index
 * GET /api/vacancy/course/:courseCode/index/:indexNumber
 * 
 * @param courseCode - Course code (e.g., 'SC2103')
 * @param indexNumber - Index number (e.g., '10294')
 * @returns Promise with single index vacancy result
 */
export async function getIndexVacancy(
  courseCode: string,
  indexNumber: string
): Promise<SingleIndexResult> {
  try {
    const response = await apiClient.get(`/vacancy/course/${courseCode}/index/${indexNumber}`);
    return parseDataResponse(singleVacancyResultSchema, response.data, 'Index vacancy');
  } catch (error: unknown) {
    // Handle error responses
    if (axios.isAxiosError(error) && error.response?.data) {
      const payload = error.response.data as { error?: string; message?: string };
      return {
        success: false,
        error: payload.error || 'unknown_error',
        errorMessage: payload.message || 'Failed to fetch vacancy',
      };
    }
    
    return {
      success: false,
      error: 'network_error',
      errorMessage: 'Failed to connect to server',
    };
  }
}
