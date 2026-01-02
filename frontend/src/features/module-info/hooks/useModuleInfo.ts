/**
 * Module Info Hook
 *
 * Handles searching modules, loading module details, and managing UI state.
 * Keeps the UI component focused on layout and composition.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getModuleDetails } from "@/shared/api/catalogue";
import type { Module, ModuleFilters } from "@/shared/api/types";
import { getErrorMessage } from "@/shared/api/client";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import {
  useModuleDependencies,
  useModuleDetails,
  useModuleSearch,
  useCurrentSemester,
} from "@/shared/data/queries/catalogue";
import type { ModulePreviewIndex, ModuleWithIndexes } from "../types";

type ModuleInfoState = {
  searchQuery: string;
  filterSemester: string;
  filterAuMin: string;
  filterAuMax: string;
  filterLevel: string;
  filterGradingType: string;
  filterBde: boolean;
  filterUe: boolean;
  filterSchool: string;
  filterDays: string[];
  hasSearched: boolean;
  selectedModule: ModuleWithIndexes | null;
  modules: Module[];
  dependencies: string[];
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  previewIndexes: ModulePreviewIndex[];
  moduleTitles: Map<string, string>;
  showFlowchart: boolean;
};

type ModuleInfoActions = {
  setSearchQuery: (value: string) => void;
  setFilterSemester: (value: string) => void;
  setFilterAuMin: (value: string) => void;
  setFilterAuMax: (value: string) => void;
  setFilterLevel: (value: string) => void;
  setFilterGradingType: (value: string) => void;
  setFilterBde: (value: boolean) => void;
  setFilterUe: (value: boolean) => void;
  setFilterSchool: (value: string) => void;
  setFilterDays: (value: string[]) => void;
  setPreviewIndexes: React.Dispatch<React.SetStateAction<ModulePreviewIndex[]>>;
  searchModules: (query: string) => void;
  handleModuleClick: (module: Module) => void;
  handleBack: () => void;
};

/**
 * Provide state and actions for the module-info feature.
 */
export function useModuleInfo(): { state: ModuleInfoState; actions: ModuleInfoActions } {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleCodeFromUrl = searchParams.get("code");

  // Fetch current semester
  const { data: currentSemester } = useCurrentSemester();

  const [searchQuery, setSearchQueryState] = useState(searchParams.get("q") || "");
  const [filterSemester, setFilterSemester] = useState(
    searchParams.get("semester") || "all"
  );
  const [filterAuMin, setFilterAuMin] = useState(searchParams.get("minAU") || "");
  const [filterAuMax, setFilterAuMax] = useState(searchParams.get("maxAU") || "");
  const [filterLevel, setFilterLevel] = useState(searchParams.get("level") || "all");
  const [filterGradingType, setFilterGradingType] = useState(searchParams.get("gradingType") || "all");
  const [filterBde, setFilterBde] = useState(searchParams.get("bde") === "true");
  const [filterUe, setFilterUe] = useState(searchParams.get("ue") === "true");
  const [filterSchool, setFilterSchool] = useState(searchParams.get("school") || "all");
  const [filterDays, setFilterDays] = useState<string[]>(
    searchParams.get("days") ? (searchParams.get("days") as string).split(",") : []
  );

  const [hasSearched, setHasSearched] = useState(true);
  const [previewIndexes, setPreviewIndexes] = useState<ModulePreviewIndex[]>([]);

  const effectiveSemester = useMemo(() => {
    if (filterSemester !== "all") return filterSemester;
    if (searchParams.get("semester")) return filterSemester;
    return currentSemester || "all";
  }, [currentSemester, filterSemester, searchParams]);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  // Placeholder for a future flowchart feature flag.
  const showFlowchart = true;

  const searchFilters = useMemo<ModuleFilters>(() => {
    const filters: ModuleFilters = {
      search: debouncedSearchQuery.trim() || undefined,
      minAU: filterAuMin ? parseInt(filterAuMin, 10) : undefined,
      maxAU: filterAuMax ? parseInt(filterAuMax, 10) : undefined,
      level: filterLevel !== "all" ? filterLevel : undefined,
      gradingType: filterGradingType !== "all" ? (filterGradingType as 'letter' | 'passFail') : undefined,
      bde: filterBde ? true : undefined,
      ue: filterUe ? true : undefined,
      school: filterSchool !== "all" ? filterSchool : undefined,
      days: filterDays.length > 0 ? filterDays : undefined,
      limit: 50,
    };

    if (effectiveSemester !== "all") {
      filters.semester = effectiveSemester;
    }

    return filters;
  }, [
    debouncedSearchQuery,
    effectiveSemester,
    filterAuMin,
    filterAuMax,
    filterLevel,
    filterGradingType,
    filterBde,
    filterUe,
    filterSchool,
    filterDays
  ]);

  const moduleSearchQuery = useModuleSearch(searchFilters, hasSearched);
  const moduleDetailsQuery = useModuleDetails(moduleCodeFromUrl, !!moduleCodeFromUrl);
  const moduleDependenciesQuery = useModuleDependencies(moduleCodeFromUrl, !!moduleCodeFromUrl);

  const selectedModule = (moduleDetailsQuery.data as ModuleWithIndexes) || null;
  const dependencies = moduleDependenciesQuery.data || [];

  const moduleTitlesQuery = useQuery({
    queryKey: ["module-titles", selectedModule?.mutualExclusions || ""],
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!selectedModule?.mutualExclusions) return map;

      const exclusionCodes = selectedModule.mutualExclusions
        .split(/[,;]/)
        .map((code) => code.trim())
        .filter((code) => /^[A-Z]{2,4}\d{4}[A-Z]?$/i.test(code));

      if (exclusionCodes.length === 0) return map;

      const batchSize = 3;
      for (let i = 0; i < exclusionCodes.length; i += batchSize) {
        const batch = exclusionCodes.slice(i, i + batchSize);
        const titlePromises = batch.map(async (code) => {
          try {
            const moduleResponse = await getModuleDetails(code);
            return { code: code.toUpperCase(), title: moduleResponse.data.name };
          } catch {
            return { code: code.toUpperCase(), title: code };
          }
        });

        const titles = await Promise.all(titlePromises);
        titles.forEach(({ code, title }) => {
          map.set(code, title);
        });

        if (i + batchSize < exclusionCodes.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      return map;
    },
    enabled: !!selectedModule?.mutualExclusions,
  });

  const modules = moduleSearchQuery.data || [];
  const moduleTitles = moduleTitlesQuery.data || new Map();

  const isLoading = moduleSearchQuery.isFetching;
  const isLoadingDetails = moduleDetailsQuery.isFetching || moduleDependenciesQuery.isFetching;
  const error = moduleSearchQuery.error
    ? getErrorMessage(moduleSearchQuery.error) || "Failed to fetch modules. Please check if the backend is running."
    : moduleDetailsQuery.error
      ? getErrorMessage(moduleDetailsQuery.error) || "Failed to load module details."
      : null;

  const setSearchQuery = useCallback((value: string) => {
    setSearchQueryState(value);
    setHasSearched(true);
  }, []);

  const searchModules = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleModuleClick = useCallback((module: Module) => {
    setPreviewIndexes([]);
    const params = new URLSearchParams(searchParams.toString());
    params.set("code", module.code);
    router.push(`/module-info?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleBack = useCallback(() => {
    setPreviewIndexes([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("code");
    router.push(`/module-info?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return {
    state: {
      searchQuery,
      filterSemester,
      filterAuMin,
      filterAuMax,
      filterLevel,
      filterGradingType,
      filterBde,
      filterUe,
      filterSchool,
      filterDays,
      hasSearched,
      selectedModule,
      modules,
      dependencies,
      isLoading,
      isLoadingDetails,
      error,
      previewIndexes,
      moduleTitles,
      showFlowchart,
    },
    actions: {
      setSearchQuery,
      setFilterSemester,
      setFilterAuMin,
      setFilterAuMax,
      setFilterLevel,
      setFilterGradingType,
      setFilterBde,
      setFilterUe,
      setFilterSchool,
      setFilterDays,
      setPreviewIndexes,
      searchModules,
      handleModuleClick,
      handleBack,
    },
  };
}
