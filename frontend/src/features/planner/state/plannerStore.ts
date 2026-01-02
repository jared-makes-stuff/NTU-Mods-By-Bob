import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlannerModule } from '@/shared/types/planner';
import type { PlannedModule } from '@/features/course-planner';

export interface CustomEvent {
  id: string;
  title: string;
  day: string; // 'MON', 'TUE', etc.
  startTime: string; // '0900'
  endTime: string;   // '1000'
  weeks: string; // '1-13'
  color?: string;
}

export interface PlannerState {
  // Course Planner State
  plannedModules: PlannedModule[];
  currentPlanId: string | null;
  admissionSemester: string; // e.g., "2025_1"

  // Timetable Planner State
  selectedModules: PlannerModule[]; // Modules selected for timetable generation
  timetableSemester: string; // Selected semester for timetable planning
  customEvents: CustomEvent[]; // User-added custom events/blocks

  // Actions for Course Planner
  setPlannedModules: (modules: PlannedModule[]) => void;
  setCurrentPlanId: (id: string | null) => void;
  setAdmissionSemester: (semester: string) => void;
  addPlannedModule: (module: PlannedModule) => void;
  removePlannedModule: (moduleId: string) => void;
  updatePlannedModule: <K extends keyof PlannedModule>(moduleId: string, field: K, value: PlannedModule[K]) => void;

  // Actions for Timetable Planner
  setSelectedModules: (modules: PlannerModule[]) => void;
  setTimetableSemester: (semester: string) => void;
  addTimetableModule: (module: PlannerModule) => void;
  removeTimetableModule: (moduleCode: string) => void;
  updateTimetableModuleIndex: (moduleCode: string, indexNumber: string) => void;
  updateTimetableModule: (moduleCode: string, updates: Partial<PlannerModule>) => void;
  reorderTimetableModule: (dragIndex: number, hoverIndex: number) => void;
  
  // Custom Event Actions
  addCustomEvent: (event: CustomEvent) => void;
  removeCustomEvent: (eventId: string) => void;
  updateCustomEvent: (eventId: string, updates: Partial<CustomEvent>) => void;
  
  // Clear Timetable Action
  clearTimetable: () => void;

  // Reset function for all planner states
  resetPlannerState: () => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      // Initial Course Planner State
      plannedModules: [],
      currentPlanId: null,
      admissionSemester: "",

      // Initial Timetable Planner State
      selectedModules: [],
      timetableSemester: "",
      customEvents: [],

      // Course Planner Actions
      setPlannedModules: (modules) => set({ plannedModules: modules }),
      setCurrentPlanId: (id) => set({ currentPlanId: id }),
      setAdmissionSemester: (semester) => set({ admissionSemester: semester }),
      addPlannedModule: (module) => set((state) => ({ plannedModules: [...state.plannedModules, module] })),
      removePlannedModule: (moduleId) => set((state) => ({ plannedModules: state.plannedModules.filter(pm => pm.id !== moduleId) })),
      updatePlannedModule: (moduleId, field, value) => set((state) => ({
        plannedModules: state.plannedModules.map(pm => pm.id === moduleId ? { ...pm, [field]: value } : pm)
      })),

      // Timetable Planner Actions
      setSelectedModules: (modules) => set({ selectedModules: modules }),
      setTimetableSemester: (semester) => set({ timetableSemester: semester }),
      addTimetableModule: (module) => set((state) => ({ selectedModules: [...state.selectedModules, module] })),
      removeTimetableModule: (moduleCode) => set((state) => ({ selectedModules: state.selectedModules.filter(m => m.code !== moduleCode) })),
      updateTimetableModuleIndex: (moduleCode, indexNumber) => set((state) => ({
        selectedModules: state.selectedModules.map(m => m.code === moduleCode ? { ...m, selectedIndex: indexNumber } : m)
      })),
      updateTimetableModule: (moduleCode, updates) => set((state) => ({
        selectedModules: state.selectedModules.map(m => m.code === moduleCode ? { ...m, ...updates } : m)
      })),
      reorderTimetableModule: (dragIndex, hoverIndex) => set((state) => {
        const draggedModule = state.selectedModules[dragIndex];
        if (!draggedModule) return {};
        
        const updatedModules = [...state.selectedModules];
        updatedModules.splice(dragIndex, 1);
        updatedModules.splice(hoverIndex, 0, draggedModule);
        return { selectedModules: updatedModules };
      }),
      
      // Custom Event Actions
      addCustomEvent: (event) => set((state) => ({ customEvents: [...state.customEvents, event] })),
      removeCustomEvent: (eventId) => set((state) => ({ customEvents: state.customEvents.filter(e => e.id !== eventId) })),
      updateCustomEvent: (eventId, updates) => set((state) => ({
        customEvents: state.customEvents.map(e => e.id === eventId ? { ...e, ...updates } : e)
      })),

      clearTimetable: () => set({ selectedModules: [], customEvents: [] }),

      resetPlannerState: () => set({
        plannedModules: [],
        currentPlanId: null,
        admissionSemester: "",
        selectedModules: [],
        timetableSemester: "",
        customEvents: [],
      }),
    }),
    {
      name: 'planner-storage', // unique name for local storage
      partialize: (state) => ({
        plannedModules: state.plannedModules,
        currentPlanId: state.currentPlanId,
        admissionSemester: state.admissionSemester,
        selectedModules: Array.isArray(state.selectedModules) ? state.selectedModules : [], // Ensure it's an array on save
        timetableSemester: state.timetableSemester,
        customEvents: state.customEvents,
      }),
      onRehydrateStorage: () => {
        return (storedState, error) => {
          if (error) {
            // Optionally clear storage if corrupted
            localStorage.removeItem('planner-storage');
          }
          if (storedState) {
            // Ensure selectedModules is an array on load
            if (!Array.isArray(storedState.selectedModules)) {
              storedState.selectedModules = [];
            }
          }
        };
      },
    }
  )
);
