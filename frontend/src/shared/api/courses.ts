/**
 * Course Planning API Service
 * 
 * Handles course plan creation, modification, and module management
 */

import { apiClient } from './client';
import { parseDataResponse } from './validation';
import { coursePlanSchema, coursePlanStatsSchema } from './schemas';
import { z } from 'zod';
import type {
  CoursePlan,
  CreateCoursePlanRequest,
  UpdateCoursePlanRequest,
  AddModuleRequest,
  MoveModuleRequest,
  CoursePlanStats,
  BackendPlannedModule,
} from './types';

/**
 * Create a new course plan
 */
export async function createCoursePlan(
  data: CreateCoursePlanRequest
): Promise<CoursePlan> {
  const response = await apiClient.post('/course-plans', data);
  return parseDataResponse(coursePlanSchema, response.data, 'Create course plan');
}

/**
 * Get all course plans for the current user
 */
export async function getUserCoursePlans(): Promise<CoursePlan[]> {
  const response = await apiClient.get('/course-plans');
  return parseDataResponse(z.array(coursePlanSchema), response.data, 'User course plans');
}

/**
 * Get a specific course plan by ID
 */
export async function getCoursePlanById(id: string): Promise<CoursePlan> {
  const response = await apiClient.get(`/course-plans/${id}`);
  return parseDataResponse(coursePlanSchema, response.data, 'Course plan details');
}

/**
 * Update a course plan
 */
export async function updateCoursePlan(
  id: string,
  data: UpdateCoursePlanRequest
): Promise<CoursePlan> {
  const response = await apiClient.put(`/course-plans/${id}`, data);
  return parseDataResponse(coursePlanSchema, response.data, 'Update course plan');
}

/**
 * Delete a course plan
 */
export async function deleteCoursePlan(id: string): Promise<void> {
  await apiClient.delete(`/course-plans/${id}`);
}

/**
 * Save full course plan (bulk update)
 * POST /api/course-plans/:id/save
 */
export async function saveCoursePlan(
  planId: string,
  modules: Array<Partial<BackendPlannedModule>>
): Promise<CoursePlan> {
  const response = await apiClient.post(
    `/course-plans/${planId}/save`,
    { modules }
  );
  return parseDataResponse(coursePlanSchema, response.data, 'Save course plan');
}

/**
 * Add a module to a course plan
 */
export async function addModuleToCoursePlan(
  coursePlanId: string,
  data: AddModuleRequest
): Promise<CoursePlan> {
  const response = await apiClient.post(
    `/course-plans/${coursePlanId}/modules`,
    data
  );
  return parseDataResponse(coursePlanSchema, response.data, 'Add course module');
}

/**
 * Remove a module from a course plan
 */
export async function removeModuleFromCoursePlan(
  coursePlanId: string,
  moduleCode: string
): Promise<CoursePlan> {
  const response = await apiClient.delete(
    `/course-plans/${coursePlanId}/modules/${moduleCode}`
  );
  return parseDataResponse(coursePlanSchema, response.data, 'Remove course module');
}

/**
 * Move a module between semesters
 */
export async function moveModuleBetweenSemesters(
  coursePlanId: string,
  data: MoveModuleRequest
): Promise<CoursePlan> {
  const response = await apiClient.put(
    `/course-plans/${coursePlanId}/modules`,
    data
  );
  return parseDataResponse(coursePlanSchema, response.data, 'Move course module');
}

/**
 * Get statistics for a course plan
 */
export async function getCoursePlanStats(coursePlanId: string): Promise<CoursePlanStats> {
  const response = await apiClient.get(
    `/course-plans/${coursePlanId}/stats`
  );
  return parseDataResponse(coursePlanStatsSchema, response.data, 'Course plan stats');
}
