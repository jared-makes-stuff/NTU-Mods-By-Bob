import { useQuery } from "@tanstack/react-query";
import {
  getAvailableSemesters,
  getCurrentSemester,
  getModuleDependencies,
  getModuleDetails,
  getSchools,
  quickSearchModules,
  searchModules,
} from "@/shared/api/catalogue";
import type { Module, ModuleFilters } from "@/shared/api/types";
import { queryKeys } from "../queryKeys";

type QuickSearchParams = {
  query: string;
  limit?: number;
  semester?: string;
  enabled?: boolean;
};

/**
 * Fetch available semesters for planners and filters.
 */
export function useAvailableSemesters(enabled = true) {
  return useQuery({
    queryKey: queryKeys.semesters,
    queryFn: async () => {
      const response = await getAvailableSemesters();
      return response.data || [];
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch current semester (highest AY in database).
 */
export function useCurrentSemester(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.semesters, "current"],
    queryFn: async () => {
      const response = await getCurrentSemester();
      return response.data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch available schools for filters.
 */
export function useSchools(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.semesters, "schools"],
    queryFn: async () => {
      const response = await getSchools();
      return response.data || [];
    },
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Quick module search for typeahead-like experiences.
 */
export function useQuickSearchModules({
  query,
  limit = 10,
  semester,
  enabled = true,
}: QuickSearchParams) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.modules.search({
      type: "quick",
      query: trimmed,
      limit,
      semester,
    }),
    queryFn: async () => {
      const response = await quickSearchModules(trimmed, limit, semester);
      return response.data || [];
    },
    enabled: enabled && trimmed.length > 0,
    staleTime: 30_000,
  });
}

/**
 * Full module search with filters and pagination.
 */
export function useModuleSearch(filters: ModuleFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.modules.search({ type: "full", ...filters }),
    queryFn: async () => {
      const response = await searchModules(filters);
      return response.data || [];
    },
    enabled,
  });
}

/**
 * Fetch module details by module code.
 */
export function useModuleDetails(moduleCode: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.modules.details(moduleCode ?? ""),
    queryFn: async () => {
      if (!moduleCode) return null;
      const response = await getModuleDetails(moduleCode);
      return response.data as Module;
    },
    enabled: enabled && !!moduleCode,
  });
}

/**
 * Fetch module dependency list.
 */
export function useModuleDependencies(moduleCode: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.modules.dependencies(moduleCode ?? ""),
    queryFn: async () => {
      if (!moduleCode) return [];
      const response = await getModuleDependencies(moduleCode);
      return response.data || [];
    },
    enabled: enabled && !!moduleCode,
  });
}
