/**
 * Timetable API Service
 * 
 * Handles timetable creation, modification, and conflict detection
 * All endpoints match backend /api/timetables routes
 */

import { apiClient } from './client';
import { parseDataResponse } from './validation';
import { timetableConflictSchema, timetableSchema, timetableSelectionSchema } from './schemas';
import { z } from 'zod';
import type {
  Timetable,
  TimetableSelection,
  CreateTimetableRequest,
  UpdateTimetableRequest,
  TimetableConflict,
} from './types';

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
 * Get a specific timetable by ID
 * GET /api/timetables/:id
 */
export async function getTimetableById(id: string): Promise<Timetable> {
  const response = await apiClient.get(`/timetables/${id}`);
  return parseDataResponse(timetableSchema, response.data, 'Timetable details');
}

/**
 * Update a timetable
 * PUT /api/timetables/:id
 */
export async function updateTimetable(
  id: string,
  data: UpdateTimetableRequest
): Promise<Timetable> {
  const response = await apiClient.put(`/timetables/${id}`, data);
  return parseDataResponse(timetableSchema, response.data, 'Update timetable');
}

/**
 * Delete a timetable
 * DELETE /api/timetables/:id
 */
export async function deleteTimetable(id: string): Promise<void> {
  await apiClient.delete(`/timetables/${id}`);
}

/**
 * Add a module/index to a timetable
 * POST /api/timetables/:id/modules
 */
export async function addModuleToTimetable(
  timetableId: string,
  data: { moduleCode: string; indexNumber: string; color?: string }
): Promise<Timetable> {
  const response = await apiClient.post(
    `/timetables/${timetableId}/modules`,
    data
  );
  return parseDataResponse(timetableSchema, response.data, 'Add timetable module');
}

/**
 * Remove a module from a timetable
 * DELETE /api/timetables/:id/modules/:moduleCode?indexNumber=xxx
 */
export async function removeModuleFromTimetable(
  timetableId: string,
  moduleCode: string,
  indexNumber: string
): Promise<Timetable> {
  const response = await apiClient.delete(
    `/timetables/${timetableId}/modules/${moduleCode}`,
    {
      params: { indexNumber },
    }
  );
  return parseDataResponse(timetableSchema, response.data, 'Remove timetable module');
}

/**
 * Generate timetable combinations
 * POST /api/timetables/generate
 */
export async function generateTimetables(data: {
  moduleCodes: string[];
  preferredDays?: string[];
  avoidDays?: string[];
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
}): Promise<Array<{ selections: TimetableSelection[]; score: number }>> {
  const response = await apiClient.post(
    `/timetables/generate`,
    data
  );
  const selectionsSchema = z.array(
    z.object({
      selections: z.array(timetableSelectionSchema),
      score: z.number(),
    })
  );
  return parseDataResponse(selectionsSchema, response.data, 'Generate timetables');
}

/**
 * Check for conflicts in a timetable
 * GET /api/timetables/:id/conflicts
 */
export async function checkTimetableConflicts(
  timetableId: string
): Promise<{ hasConflict: boolean; conflicts: TimetableConflict[] }> {
  const response = await apiClient.get(
    `/timetables/${timetableId}/conflicts`
  );
  return parseDataResponse(
    z.object({
      hasConflict: z.boolean(),
      conflicts: z.array(timetableConflictSchema),
    }),
    response.data,
    'Timetable conflicts'
  );
}
