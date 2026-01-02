/**
 * Catalogue API Service
 * 
 * Handles module search and information retrieval
 * All endpoints match backend /api/modules routes
 */

import { apiClient } from './client';
import { parseApiResponse } from './validation';
import { moduleIndexRecordSchema, moduleSchema, paginatedResponseSchema } from './schemas';
import { z } from 'zod';
import { createAsyncCache } from './requestCache';
import type {
  Module,
  ModuleFilters,
  ModuleIndexRecord,
  PaginatedResponse,
} from './types';

type ModuleSearchParams = {
  q: string;
  limit: number;
  semester?: string;
};

const MODULE_INDEX_CACHE_TTL_MS = 10 * 60 * 1000;
const moduleIndexCache = createAsyncCache<ModuleIndexRecord[]>();

const normalizeModuleCode = (moduleCode: string) => moduleCode.trim().toUpperCase();

/**
 * Search for modules with filters and pagination
 * GET /api/modules
 */
export async function searchModules(
  filters: ModuleFilters = {}
): Promise<PaginatedResponse<Module>> {
  const response = await apiClient.get('/modules', {
    params: filters,
  });

  return parseApiResponse(paginatedResponseSchema(moduleSchema), response.data, 'Module search');
}

/**
 * Quick search for modules by code and title only
 * GET /api/modules/search?q=query&limit=10&semester=2025_2
 * Searches ONLY module code and name (faster, more precise)
 * Optionally filters by semester
 */
export async function quickSearchModules(query: string, limit = 10, semester?: string): Promise<{ data: Module[] }> {
  const params: ModuleSearchParams = semester ? { q: query, limit, semester } : { q: query, limit };
  const response = await apiClient.get('/modules/search', { params });
  return parseApiResponse(z.object({ data: z.array(moduleSchema) }), response.data, 'Module quick search');
}

/**
 * Deep search for modules including descriptions
 * GET /api/modules/search-all?q=query&limit=10
 * Searches module code, name, AND description (comprehensive)
 */
export async function searchModulesAll(query: string, limit = 10): Promise<{ data: Module[] }> {
  const response = await apiClient.get('/modules/search-all', {
    params: { q: query, limit },
  });
  return parseApiResponse(z.object({ data: z.array(moduleSchema) }), response.data, 'Module deep search');
}

/**
 * Get detailed information about a specific module
 * GET /api/modules/:code
 */
export async function getModuleDetails(moduleCode: string): Promise<{ data: Module }> {
  // Clean and encode the module code to handle any special characters
  const cleanCode = moduleCode.trim().replace(/\(.*?\)/gi, '').trim();
  const response = await apiClient.get(`/modules/${encodeURIComponent(cleanCode)}`);
  return parseApiResponse(z.object({ data: moduleSchema }), response.data, 'Module details');
}

/**
 * Get all indexes for a module
 * Optionally filtered by semester
 * GET /api/modules/:code/indexes?semester=2025_2
 */
export async function getModuleIndexes(moduleCode: string, semester?: string): Promise<{ data: ModuleIndexRecord[] }> {
  const cleanCode = normalizeModuleCode(moduleCode);
  const cacheKey = `${cleanCode}:${semester || 'all'}`;

  const data = await moduleIndexCache.getOrSet(
    cacheKey,
    async () => {
      const params = semester ? { semester } : {};
      const response = await apiClient.get(`/modules/${encodeURIComponent(cleanCode)}/indexes`, { params });
      const payload = parseApiResponse(
        z.object({ data: z.array(moduleIndexRecordSchema) }),
        response.data,
        'Module indexes'
      );
      return payload.data;
    },
    MODULE_INDEX_CACHE_TTL_MS
  );

  return { data };
}

/**
 * Check prerequisites for a module
 * GET /api/modules/:code/prerequisites
 */
export async function checkPrerequisites(moduleCode: string): Promise<{ data: Record<string, unknown> }> {
  const response = await apiClient.get(`/modules/${moduleCode}/prerequisites`);
  return parseApiResponse(
    z.object({ data: z.record(z.string(), z.unknown()) }),
    response.data,
    'Module prerequisites'
  );
}

/**
 * Get module statistics
 * GET /api/modules/stats
 */
export async function getModuleStats(): Promise<{ data: Record<string, unknown> }> {
  const response = await apiClient.get('/modules/stats');
  return parseApiResponse(
    z.object({ data: z.record(z.string(), z.unknown()) }),
    response.data,
    'Module stats'
  );
}

/**
 * Get available semesters
 * GET /api/semesters
 */
export async function getAvailableSemesters(): Promise<{ data: string[] }> {
  const response = await apiClient.get('/semesters');
  return parseApiResponse(z.object({ data: z.array(z.string()) }), response.data, 'Available semesters');
}

/**
 * Get current semester (highest semester in the database)
 * GET /api/semesters/current
 */
export async function getCurrentSemester(): Promise<{ data: string | null }> {
  const response = await apiClient.get('/semesters/current');
  return parseApiResponse(z.object({ data: z.string().nullable() }), response.data, 'Current semester');
}

/**
 * Get dependencies for a module
 * GET /api/modules/:code/dependencies
 * Returns array of module codes that have this module as a prerequisite
 */
export async function getModuleDependencies(moduleCode: string): Promise<{ data: string[] }> {
  const cleanCode = moduleCode.trim().replace(/\(.*?\)/gi, '').trim();
  const response = await apiClient.get(`/modules/${encodeURIComponent(cleanCode)}/dependencies`);
  return parseApiResponse(z.object({ data: z.array(z.string()) }), response.data, 'Module dependencies');
}

/**
 * Get modules by school
 */
export async function getModulesBySchool(school: string): Promise<Module[]> {
  const response = await apiClient.get(`/catalogue/schools/${school}/modules`);
  return parseApiResponse(z.array(moduleSchema), response.data, 'Modules by school');
}

/**
 * Get available schools
 * GET /api/schools
 */
export async function getSchools(): Promise<{ data: string[] }> {
  const response = await apiClient.get('/schools');
  return parseApiResponse(z.object({ data: z.array(z.string()) }), response.data, 'Available schools');
}
