/**
 * Timetable Generation API
 * 
 * Handles communication with the backend for timetable generation and validation.
 */

import { apiClient, getErrorMessage } from './client';
import { getAxiosErrorMessage, getErrorStatus, isAxiosError } from './errors';
import { parseApiResponse } from './validation';
import { apiResponseSchema, timetableGenerationPayloadSchema, timetableValidationSchema } from './schemas';
import type { GenerationFilters } from '@/shared/types/timetableGeneration';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const getTimetableErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { error?: string; message?: string } | undefined;
    return payload?.error || payload?.message || error.message || fallback;
  }

  return getErrorMessage(error) || fallback;
};

/**
 * Module with available indexes for timetable generation
 */
export interface ModuleWithIndexes {
  code: string;
  name: string;
  au: number;
  selectedIndex?: string;
  indexes: Array<{
    indexNumber: string;
    type: string;
    group: string;
    classes: Array<{
      day: string;
      startTime: string;
      endTime: string;
      venue: string;
      weeks: string;
      remark?: string;
    }>;
  }>;
}

/**
 * Generated timetable combination
 */
export interface TimetableCombination {
  id: string;
  score: number;
  modules: Array<{
    code: string;
    indexNumber: string;
  }>;
  classes: Array<{
    moduleCode: string;
    indexNumber: string;
    type: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    weeks: string;
  }>;
  stats: {
    totalDays: number;
    totalHours: number;
    averageGapDuration: number;
    earliestStart: string;
    latestEnd: string;
  };
}

/**
 * Module definition for generation request
 */
export interface ModuleForGeneration {
  code: string;
  indexNumbers: string[];
}

/**
 * Timetable generation request
 */
export interface GenerateTimetableRequest {
  modules: ModuleForGeneration[];
  filters: GenerationFilters;
  semester: string;
}

/**
 * Timetable validation request
 */
export interface ValidateTimetableRequest {
  combination: Array<{
    moduleCode: string;
    indexNumber: string;
  }>;
  semester: string;
}

/**
 * Timetable validation result
 */
export interface TimetableValidation {
  isValid: boolean;
  conflicts: Array<{
    type: 'time_clash' | 'missing_required' | 'invalid_index';
    message: string;
    modules?: string[];
  }>;
  warnings: Array<{
    type: string;
    message: string;
  }>;
}

/**
 * Generate optimized timetable combinations
 * 
 * @param data - Modules, filters, and semester for generation
 * @returns Generated timetable combinations with scores
 */
export async function generateTimetable(
  data: GenerateTimetableRequest
): Promise<ApiResponse<{ 
  combinations: TimetableCombination[]; 
  totalCombinations: number;
  returnedCount: number;
  hasMore: boolean;
  generatedAt: string;
}>> {
  try {
    const response = await apiClient.post('/timetable/generate', data);
    return parseApiResponse(
      apiResponseSchema(timetableGenerationPayloadSchema),
      response.data,
      'Timetable generation'
    );
  } catch (error: unknown) {
    const status = getErrorStatus(error);
    const message = getAxiosErrorMessage(error);
    if (status === 400 && message?.includes('validation')) {
      return { success: false, error: 'Invalid generation request' };
    }
    return {
      success: false,
      error: getTimetableErrorMessage(error, 'Failed to generate timetable'),
    };
  }
}

/**
 * Validate a specific timetable combination
 * 
 * @param data - Combination to validate
 * @returns Validation result with conflicts and warnings
 */
export async function validateTimetable(
  data: ValidateTimetableRequest
): Promise<ApiResponse<TimetableValidation>> {
  try {
    const response = await apiClient.post('/timetable/validate', data);
    return parseApiResponse(
      apiResponseSchema(timetableValidationSchema),
      response.data,
      'Timetable validation'
    );
  } catch (error: unknown) {
    return {
      success: false,
      error: getTimetableErrorMessage(error, 'Failed to validate timetable'),
    };
  }
}
