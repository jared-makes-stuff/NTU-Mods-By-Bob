/**
 * API Index
 * 
 * Central export point for all API services
 */

// Export client and utilities
export { apiClient, getErrorMessage } from './client';
export type { ApiError } from './client';
export {
  getErrorStatus,
  getAxiosErrorCode,
  getAxiosErrorMessage,
  getAxiosErrorPayload,
  isAxiosError,
  normalizeApiError,
} from './errors';
export { parseApiResponse, parseDataResponse, ApiResponseValidationError } from './validation';
export * from './schemas';
export { createAsyncCache } from './requestCache';
export type { AsyncCache, CacheEntry } from './requestCache';

// Export all types
export type * from './types';

// Export all services
export * as auth from './auth';
export * as catalogue from './catalogue';
export * as courses from './courses';
export * as timetables from './timetables';
export * as user from './user';
export * as vacancyAlerts from './vacancyAlerts';
