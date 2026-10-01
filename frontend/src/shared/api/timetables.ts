/**
 * Timetable API Service
 * 
 * Handles saved timetable creation and retrieval.
 * All endpoints match backend /api/timetables routes.
 */

import { apiClient } from './client';
import { parseDataResponse } from './validation';
import { timetableSchema } from './schemas';
import { z } from 'zod';
import type { Timetable, CreateTimetableRequest } from './types';

/**
 * Create a new timetable
 * POST /api/timetables
 */
export async function createTimetable(
  data: CreateTimetableRequest
): Promise<Timetable> {
  const response = await apiClient.post('/timetables', data);
  return parseDataResponse(timetableSchema, response.data, 'Create timetable');
}

/**
 * Get all timetables for the current user
 * GET /api/timetables
 */
export async function getUserTimetables(): Promise<Timetable[]> {
  const response = await apiClient.get('/timetables');
  return parseDataResponse(z.array(timetableSchema), response.data, 'User timetables');
}

/**
 * Delete a timetable
 * DELETE /api/timetables/:id
 */
export async function deleteTimetable(id: string): Promise<void> {
  await apiClient.delete(`/timetables/${id}`);
}
