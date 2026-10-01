import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlannedModule } from '../utils';
import _ from 'lodash';

interface CoursePlannerState {
  // Current working state
  plannedModules: PlannedModule[];
  metadata: Record<string, unknown> | null;

  // Last saved state (for dirty check)
  savedPlannedModules: PlannedModule[];

  selectedRows: Set<string>;
  importError: string;
  searchQuery: string;

  setPlannedModules: (modules: PlannedModule[] | ((prev: PlannedModule[]) => PlannedModule[])) => void;
  setMetadata: (meta: Record<string, unknown> | null) => void;

  // Marks current state as saved (syncs savedState = currentState)
  markAsSaved: () => void;

  // Check if dirty
  hasUnsavedChanges: () => boolean;

  setSelectedRows: (rows: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setImportError: (error: string) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

function restoreRoadmapState(persisted: unknown) {
  const stored = persisted as Partial<CoursePlannerState> | undefined;
  return {
    plannedModules: Array.isArray(stored?.plannedModules) ? stored.plannedModules : [],
    savedPlannedModules: Array.isArray(stored?.savedPlannedModules) ? stored.savedPlannedModules : [],
    metadata: stored?.metadata ?? null,
  };
}

export const useCoursePlannerStore = create<CoursePlannerState>()(
  persist(
    (set, get) => ({
      plannedModules: [],
      metadata: null,

      savedPlannedModules: [],

      selectedRows: new Set(),
      importError: '',
      searchQuery: '',

      setPlannedModules: (modules) => set((state) => ({
        plannedModules: typeof modules === 'function' ? modules(state.plannedModules) : modules
      })),
      setMetadata: (meta) => set({ metadata: meta }),

      markAsSaved: () => {
        const state = get();
        set({
          savedPlannedModules: state.plannedModules,
        });
      },

      hasUnsavedChanges: () => {
        const state = get();
        // Compare deep equality of significant fields
        return !_.isEqual(state.plannedModules, state.savedPlannedModules);
      },

      setSelectedRows: (rows) => set((state) => ({
        selectedRows: typeof rows === 'function' ? rows(state.selectedRows) : rows
      })),
      setImportError: (error) => set({ importError: error }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      reset: () => set({
        plannedModules: [],
        metadata: null,
        savedPlannedModules: [],
        selectedRows: new Set(),
        importError: '',
        searchQuery: ''
      })
    }),
    {
      name: 'course-planner-storage', // unique name
      version: 1,
      // Upgrade writes the filtered state back before the next user edit.
      migrate: restoreRoadmapState,
      merge: (persisted, current) => ({ ...current, ...restoreRoadmapState(persisted) }),
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
      }),
      partialize: (state) => ({
        // Persist these fields
        plannedModules: state.plannedModules,
        metadata: state.metadata,
        savedPlannedModules: state.savedPlannedModules,
      }),
    }
  )
);
