/**
 * Planner API Service
 * 
 * Handles course plan syncing (JSONB architecture)
 */

import { apiClient } from './client';
import { parseDataResponse } from './validation';
import { z } from 'zod';
import type { PlannedModule } from './types';

export interface CoursePlanData {
    modules: PlannedModule[];
    metadata?: Record<string, unknown> | null;
}

const planSchema = z.object({
    id: z.string().optional(),
    userId: z.string().optional(),
    modules: z.array(z.any()), // We can be more specific if we duplicate the schema
    metadata: z.any().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

/**
 * Get user's course plan
 */
export async function getPlan(): Promise<CoursePlanData> {
    const response = await apiClient.get('/plan');
    const data = parseDataResponse(planSchema, response.data, 'Get course plan');

    return {
        modules: (data.modules as PlannedModule[]) || [],
        metadata: data.metadata as Record<string, unknown> | null,
    };
}

/**
 * Save user's course plan (full upsert)
 */
export async function savePlan(data: CoursePlanData): Promise<CoursePlanData> {
    const response = await apiClient.post('/plan', data);
    const result = parseDataResponse(planSchema, response.data, 'Save course plan');

    return {
        modules: (result.modules as PlannedModule[]) || [],
        metadata: result.metadata as Record<string, unknown> | null,
    };
}
