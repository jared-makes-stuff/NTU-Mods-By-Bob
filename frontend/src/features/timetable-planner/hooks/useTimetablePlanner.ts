/**
 * Timetable Planner Hook
 *
 * Manages state, data fetching, and actions for the timetable planner feature.
 * UI components should consume this hook and focus on rendering only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { usePlannerStore } from "@/features/planner";
import type { CustomEvent, PlannerState } from "@/features/planner";
import { useToast } from "@/shared/hooks/use-toast";
import { getModuleIndexes, quickSearchModules } from "@/shared/api/catalogue";
import type { TimetableCombination } from "@/shared/api/timetable";
import type { Module, Timetable } from "@/shared/api/types";
import type { PlannerModule } from "@/shared/types/planner";
import type { IndexData } from "@/shared/types/timetable";
import { getErrorMessage } from "@/shared/api/client";
import { useAvailableSemesters } from "@/shared/data/queries/catalogue";
import type { GenerationFilters } from "../types";
import { getDefaultGenerationFilters } from "./timetablePlannerDefaults";
import { buildActiveIndexes, buildActivePreviewIndexes, calculateTotalAus } from "./timetablePlannerDerived";
import { applyGeneratedTimetable, buildModulesForGeneration, runTimetableGeneration } from "./timetablePlannerGeneration";
import { loadTimetablePreset } from "./timetablePlannerPresets";
import { downloadTimetableScreenshot } from "./timetablePlannerScreenshot";
import { syncModuleIndexesForSemester } from "./timetablePlannerSync";

export type TimetablePlannerState = {
  selectedModules: PlannerModule[];
  semester: string;
  customEvents: CustomEvent[];
  searchQuery: string;
  searchResults: Module[];
  isSearching: boolean;
  isGenerating: boolean;
  availableSemesters: string[];
  selectedWeek: number;
  currentTimetableName: string | null;
  isAddEventDialogOpen: boolean;
  previewingModuleCode: string | null;
  hoveredPreviewIndex: string | null;
  isSaveDialogOpen: boolean;
  isLoadDialogOpen: boolean;
  activeTab: "modules" | "plan";
  selectedIndexesForGeneration: Set<string>;
  generatedTimetables: TimetableCombination[];
  currentTimetableIndex: number;
  hasMoreTimetables: boolean;
  filters: GenerationFilters;
  resultsPage: number;
  isAuthenticated: boolean;
  activeIndexes: IndexData[];
  activePreviewIndexes: IndexData[];
  totalAUs: number;
};

export type TimetablePlannerActions = {
  setSearchQuery: (value: string) => void;
  setSelectedWeek: (value: number) => void;
  setIsAddEventDialogOpen: (value: boolean) => void;
  setPreviewingModuleCode: (value: string | null) => void;
  setHoveredPreviewIndex: (value: string | null) => void;
  setIsSaveDialogOpen: (value: boolean) => void;
  setIsLoadDialogOpen: (value: boolean) => void;
  setActiveTab: (value: "modules" | "plan") => void;
  setSelectedIndexesForGeneration: React.Dispatch<React.SetStateAction<Set<string>>>;
  setResultsPage: (value: number | ((prev: number) => number)) => void;
  setCurrentTimetableIndex: (value: number) => void;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
  setSemester: (value: string) => void;
  setCurrentTimetableName: (value: string | null) => void;
  handleScreenshot: () => Promise<void>;
  handleLoadPreset: (preset: Timetable) => Promise<void>;
  addModule: (module: Module) => Promise<void>;
  removeModule: (code: string) => void;
  reorderModule: (dragIndex: number, hoverIndex: number) => void;
  handleIndexSelect: (moduleCode: string, indexNumber: string) => void;
  handleIndexClick: (indexNumber: string, moduleCode?: string, isPreview?: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
  generateTimetable: () => Promise<void>;
};

export type TimetablePlannerRefs = {
  plannerRef: React.RefObject<HTMLDivElement | null>;
  screenshotRef: React.RefObject<HTMLDivElement | null>;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Provide state, refs, and actions for timetable planner UI.
 */
export function useTimetablePlanner(): {
  state: TimetablePlannerState;
  actions: TimetablePlannerActions;
  refs: TimetablePlannerRefs;
  storeActions: {
    addCustomEvent: PlannerState["addCustomEvent"];
    removeCustomEvent: PlannerState["removeCustomEvent"];
    clearTimetable: PlannerState["clearTimetable"];
    addTimetableModule: PlannerState["addTimetableModule"];
    updateTimetableModule: PlannerState["updateTimetableModule"];
    setSelectedModules: PlannerState["setSelectedModules"];
  };
} {
  const {
    selectedModules,
    setSelectedModules,
    timetableSemester: semester,
    setTimetableSemester: setSemester,
    customEvents,
    addCustomEvent,
    removeCustomEvent,
    addTimetableModule,
    updateTimetableModule,
    clearTimetable,
  } = usePlannerStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Module[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [currentTimetableName, setCurrentTimetableName] = useState<string | null>(null);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [previewingModuleCode, setPreviewingModuleCode] = useState<string | null>(null);
  const [hoveredPreviewIndex, setHoveredPreviewIndex] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"modules" | "plan">("modules");
  const [selectedIndexesForGeneration, setSelectedIndexesForGeneration] = useState<Set<string>>(new Set());
  const [generatedTimetables, setGeneratedTimetables] = useState<TimetableCombination[]>([]);
  const [currentTimetableIndex, setCurrentTimetableIndex] = useState(0);
  const [hasMoreTimetables, setHasMoreTimetables] = useState(false);
  const [resultsPage, setResultsPage] = useState(0);

  const [filters, setFilters] = useState<GenerationFilters>(() => getDefaultGenerationFilters());

  const plannerRef = useRef<HTMLDivElement | null>(null);
  const screenshotRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedSemester = useRef<string | null>(null);

  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const semestersQuery = useAvailableSemesters();
  const availableSemesters = useMemo(() => semestersQuery.data ?? [], [semestersQuery.data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScreenshot = async () => {
    await downloadTimetableScreenshot({
      screenshotRef,
      currentTimetableName,
      toast,
    });
  };

  const handleLoadPreset = async (preset: Timetable) => {
    await loadTimetablePreset({
      preset,
      semester,
      setSemester,
      clearTimetable,
      setCurrentTimetableName,
      addCustomEvent,
      setSelectedModules,
    });
  };

  useEffect(() => {
    if (availableSemesters.length === 0) return;
    if (!semester || !availableSemesters.includes(semester)) {
      setSemester(availableSemesters[0] || "");
    }
  }, [availableSemesters, semester, setSemester]);

  useEffect(() => {
    if (!semester) return;
    if (lastSyncedSemester.current === semester) return;

    const modules = Array.isArray(selectedModules) ? selectedModules : [];
    if (modules.length > 0) {
      lastSyncedSemester.current = semester;
      void syncModuleIndexesForSemester({
        semester,
        selectedModules: modules,
        setSelectedModules,
      });
    } else {
      lastSyncedSemester.current = semester;
    }
  }, [semester, selectedModules, setSelectedModules]);

  const activeIndexes = useMemo(
    () =>
      buildActiveIndexes({
        selectedModules: Array.isArray(selectedModules) ? selectedModules : [],
        previewingModuleCode,
        customEvents,
      }),
    [selectedModules, previewingModuleCode, customEvents]
  );

  const activePreviewIndexes = useMemo(
    () =>
      buildActivePreviewIndexes(
        Array.isArray(selectedModules) ? selectedModules : [],
        previewingModuleCode
      ),
    [previewingModuleCode, selectedModules]
  );

  const totalAUs = useMemo(
    () => calculateTotalAus(Array.isArray(selectedModules) ? selectedModules : []),
    [selectedModules]
  );

  const fetchModules = useCallback(
    async (query: string) => {
      if (!query.trim()) return [];
      try {
        const response = await quickSearchModules(query, 10, semester);
        return response.data || [];
      } catch {
        return [];
      }
    },
    [semester]
  );

  const searchModules = useCallback(
    async (query: string) => {
      setIsSearching(true);
      const results = await fetchModules(query);
      setSearchResults(results);
      setIsSearching(false);
    },
    [fetchModules]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchModules(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchModules]);

  const addModule = async (mod: Module) => {
    const modules = Array.isArray(selectedModules) ? selectedModules : [];
    if (modules.length >= 15) {
      alert("Maximum 15 modules allowed");
      return;
    }

    if (!modules.find((m) => m.code === mod.code)) {
      const newModule: PlannerModule = { ...mod };
      addTimetableModule(newModule);

      setSearchQuery("");
      setSearchResults([]);

      try {
        const indexesResponse = await getModuleIndexes(mod.code, semester);
        const indexes = indexesResponse.data || [];

        updateTimetableModule(mod.code, { indexes });
      } catch {
        // Ignore index lookup failures for now; user can retry later.
      }
    }
  };

  const removeModule = (code: string) => {
    const modules = Array.isArray(selectedModules) ? selectedModules : [];
    setSelectedModules(modules.filter((m) => m.code !== code));
  };

  const reorderModule = (dragIndex: number, hoverIndex: number) => {
    const modules = Array.isArray(selectedModules) ? selectedModules : [];
    const draggedModule = modules[dragIndex];
    if (!draggedModule) return;

    const updatedModules = [...modules];
    updatedModules.splice(dragIndex, 1);
    updatedModules.splice(hoverIndex, 0, draggedModule);
    setSelectedModules(updatedModules);
  };

  const handleIndexSelect = (moduleCode: string, indexNumber: string) => {
    const modules = Array.isArray(selectedModules) ? selectedModules : [];
    const updated = modules.map((m) => (m.code === moduleCode ? { ...m, selectedIndex: indexNumber } : m));
    setSelectedModules(updated);
  };

  const handleIndexClick = (indexNumber: string, moduleCode?: string, isPreview?: boolean) => {
    const targetCode = moduleCode;
    if (!targetCode) return;

    if (isPreview) {
      handleIndexSelect(targetCode, indexNumber);
      setPreviewingModuleCode(null);
    } else if (previewingModuleCode === targetCode) {
      setPreviewingModuleCode(null);
    } else {
      setPreviewingModuleCode(targetCode);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    if (searchResults.length > 0) {
      await addModule(searchResults[0]);
      return;
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = await fetchModules(searchQuery);
      setSearchResults(results);
      setIsSearching(false);

      if (results.length > 0) {
        await addModule(results[0]);
      }
    }
  };

  const generateTimetable = async () => {
    setIsGenerating(true);
    try {
      const modulesForGeneration = buildModulesForGeneration(
        Array.isArray(selectedModules) ? selectedModules : [],
        selectedIndexesForGeneration
      );

      if (modulesForGeneration.length === 0) {
        toast({
          title: "No modules",
          description: "Please add modules with indexes first.",
          variant: "destructive",
        });
        return;
      }

      const generationResult = runTimetableGeneration({
        modules: modulesForGeneration,
        filters,
      });

      const { combinations, returnedCount, hasMore } = generationResult;

      setGeneratedTimetables(combinations);
      setCurrentTimetableIndex(0);
      setResultsPage(0);
      setHasMoreTimetables(hasMore);

      if (returnedCount === 0) {
        toast({
          title: "No permutations found",
          description: "No valid timetable combinations found with current filters. Try adjusting your preferences.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: hasMore
            ? `Generated ${returnedCount} timetable combinations (showing first ${Math.min(10, returnedCount)}).`
            : `Generated ${returnedCount} timetable combination${returnedCount > 1 ? "s" : ""}.`,
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err) || "Failed to generate timetable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (generatedTimetables.length === 0 || currentTimetableIndex < 0) return;

    const modules = Array.isArray(selectedModules) ? selectedModules : [];
    const { updatedModules, hasChanges } = applyGeneratedTimetable(
      generatedTimetables,
      currentTimetableIndex,
      modules
    );

    if (hasChanges) {
      setSelectedModules(updatedModules);
    }
  }, [currentTimetableIndex, generatedTimetables, selectedModules, setSelectedModules]);

  return {
    state: {
      selectedModules: Array.isArray(selectedModules) ? selectedModules : [],
      semester,
      customEvents,
      searchQuery,
      searchResults,
      isSearching,
      isGenerating,
      availableSemesters,
      selectedWeek,
      currentTimetableName,
      isAddEventDialogOpen,
      previewingModuleCode,
      hoveredPreviewIndex,
      isSaveDialogOpen,
      isLoadDialogOpen,
      activeTab,
      selectedIndexesForGeneration,
      generatedTimetables,
      currentTimetableIndex,
      hasMoreTimetables,
      filters,
      resultsPage,
      isAuthenticated,
      activeIndexes,
      activePreviewIndexes,
      totalAUs,
    },
    actions: {
      setSearchQuery,
      setSelectedWeek,
      setIsAddEventDialogOpen,
      setPreviewingModuleCode,
      setHoveredPreviewIndex,
      setIsSaveDialogOpen,
      setIsLoadDialogOpen,
      setActiveTab,
      setSelectedIndexesForGeneration,
      setResultsPage,
      setCurrentTimetableIndex,
      setFilters,
      setSemester,
      setCurrentTimetableName,
      handleScreenshot,
      handleLoadPreset,
      addModule,
      removeModule,
      reorderModule,
      handleIndexSelect,
      handleIndexClick,
      handleKeyDown,
      generateTimetable,
    },
    refs: {
      plannerRef,
      screenshotRef,
      searchContainerRef,
    },
    storeActions: {
      addCustomEvent,
      removeCustomEvent,
      clearTimetable,
      addTimetableModule,
      updateTimetableModule,
      setSelectedModules,
    },
  };
}
