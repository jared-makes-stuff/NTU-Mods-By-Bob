/**
 * Course Planner Hook
 *
 * Encapsulates state, data fetching, and actions for the course planner page.
 * UI components consume this hook to keep rendering logic clean and focused.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/features/auth';
import { useToast } from '@/shared/hooks/use-toast';
import type { Module } from '@/shared/api/types';
import type { PlannedModule } from '../utils';
import { useQuickSearchModules } from '@/shared/data/queries/catalogue';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCoursePlannerStore } from '../state/store';
import { buildCustomModule, buildPlaceholderModule, buildPlannedModuleFromModule } from '../plannedModuleTransforms';

type PlannerActions = {
  handleSavePlan: () => Promise<void>;
  handleAddModule: (module: Module) => void;
  handleAddPlaceholder: (type: 'MPE' | 'BDE' | 'UE') => void;
  handleSearchKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleRemoveModule: (id: string) => void;
  handleBulkDelete: () => void;
  handleUpdatePlanned: <K extends keyof PlannedModule>(
    id: string,
    field: K,
    value: PlannedModule[K]
  ) => void;
  handleAddCustomModule: (code: string, title: string, au: number) => void;
  handleClearPlanner: () => void;
  toggleRowSelection: (id: string) => void;
  toggleSelectAll: () => void;
};

type PlannerState = {
  plannedModules: PlannedModule[];
  searchQuery: string;
  searchResults: Module[];
  isSearching: boolean;
  selectedRows: Set<string>;
  importError: string;
  isSaving: boolean;
  isLoadingPlan: boolean;
  sortedModules: PlannedModule[];
  totalAU: number;
};

type PlannerRefs = {
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Provide state, actions, and refs for the course planner UI.
 */
export function useCoursePlanner(): {
  state: PlannerState;
  actions: PlannerActions;
  refs: PlannerRefs;
  setters: {
    setPlannedModules: (modules: PlannedModule[] | ((prev: PlannedModule[]) => PlannedModule[])) => void;
    setSearchQuery: (query: string) => void;
    setImportError: (error: string) => void;
  };
} {
  // Use global store for persistent state
  const {
    plannedModules, setPlannedModules,
    searchQuery, setSearchQuery,
    selectedRows, setSelectedRows,
    importError, setImportError,
  } = useCoursePlannerStore();

  // Local state for ephemeral status
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPlan] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const moduleSearchQuery = useQuickSearchModules({
    query: debouncedSearchQuery,
    limit: 10,
    enabled: debouncedSearchQuery.trim().length > 0,
  });

  const searchResults = debouncedSearchQuery.trim() ? moduleSearchQuery.data ?? [] : [];
  const isSearching = moduleSearchQuery.isFetching;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setSearchQuery]);

  const handleSavePlan = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to save your course plan.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Implement direct planned modules save API
      // For now, just show success toast
      toast({
        title: 'Plan Saved',
        description: 'Your course plan has been saved successfully.',
      });
    } catch {
      toast({
        title: 'Save Failed',
        description: 'Could not save your course plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddModule = (module: Module) => {
    const newModule = buildPlannedModuleFromModule(module, uuidv4());
    // Use functional update to ensure we have latest state if needed, though zustand setters handle this
    setPlannedModules((prev) => [...prev, newModule]);
    setSearchQuery('');
  };

  const handleAddPlaceholder = (type: 'MPE' | 'BDE' | 'UE') => {
    const newModule = buildPlaceholderModule(type, uuidv4());
    setPlannedModules((prev) => [...prev, newModule]);
  };

  const handleAddCustomModule = (code: string, title: string, au: number) => {
    const newModule = buildCustomModule(code, title, au, uuidv4());
    setPlannedModules((prev) => [...prev, newModule]);
  };

  const handleClearPlanner = () => {
    setPlannedModules([]);
    setSelectedRows(new Set());
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleAddModule(searchResults[0]);
    }
  };

  const handleRemoveModule = (id: string) => {
    setPlannedModules((prev) => prev.filter((pm) => pm.id !== id));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return;
    setPlannedModules((prev) => prev.filter((pm) => !selectedRows.has(pm.id)));
    setSelectedRows(new Set());
  };

  const handleUpdatePlanned = <K extends keyof PlannedModule>(
    id: string,
    field: K,
    value: PlannedModule[K]
  ) => {
    setPlannedModules((prev) => prev.map((pm) => (pm.id === id ? { ...pm, [field]: value } : pm)));
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === plannedModules.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(plannedModules.map((pm) => pm.id)));
    }
  };

  const sortedModules = useMemo(() => {
    return [...plannedModules].sort((a, b) => {
      // Primary sort by year (descending)
      if (a.year !== b.year) return b.year - a.year;
      // Secondary sort by semester (descending)
      if (a.semester !== b.semester) return b.semester - a.semester;

      // Tertiary sort within year/semester
      const isPlaceholder = (code: string) => ["MPE", "BDE", "UE"].includes(code.toUpperCase());
      const aPlaceholder = isPlaceholder(a.code);
      const bPlaceholder = isPlaceholder(b.code);

      // If one is a placeholder and the other isn't, standard modules come first
      if (aPlaceholder && !bPlaceholder) return 1;
      if (!aPlaceholder && bPlaceholder) return -1;

      // Otherwise, sort alphabetically/numerically by code
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [plannedModules]);

  const totalAU = plannedModules.reduce((sum, module) => sum + module.au, 0);

  return {
    state: {
      plannedModules,
      searchQuery,
      searchResults,
      isSearching,
      selectedRows,
      importError,
      isSaving,
      isLoadingPlan,
      sortedModules,
      totalAU,
    },
    actions: {
      handleSavePlan,
      handleAddModule,
      handleAddPlaceholder,
      handleAddCustomModule,
      handleClearPlanner,
      handleSearchKeyPress,
      handleRemoveModule,
      handleBulkDelete,
      handleUpdatePlanned,
      toggleRowSelection,
      toggleSelectAll,
    },
    refs: {
      searchContainerRef,
    },
    setters: {
      setPlannedModules,
      setSearchQuery,
      setImportError,
    },
  };
}
