import { create } from 'zustand';
import type { PlannedModule } from '../utils';

interface CoursePlannerState {
  plannedModules: PlannedModule[];
  selectedRows: Set<string>;
  importError: string;
  searchQuery: string;
  
  setPlannedModules: (modules: PlannedModule[] | ((prev: PlannedModule[]) => PlannedModule[])) => void;
  setSelectedRows: (rows: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setImportError: (error: string) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

export const useCoursePlannerStore = create<CoursePlannerState>((set) => ({
  plannedModules: [],
  selectedRows: new Set(),
  importError: '',
  searchQuery: '',

  setPlannedModules: (modules) => set((state) => ({
    plannedModules: typeof modules === 'function' ? modules(state.plannedModules) : modules
  })),
  setSelectedRows: (rows) => set((state) => ({
    selectedRows: typeof rows === 'function' ? rows(state.selectedRows) : rows
  })),
  setImportError: (error) => set({ importError: error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  reset: () => set({
    plannedModules: [],
    selectedRows: new Set(),
    importError: '',
    searchQuery: ''
  })
}));
