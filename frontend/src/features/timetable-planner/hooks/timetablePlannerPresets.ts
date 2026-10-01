import { getModuleDetails, getModuleIndexes } from "@/shared/api/catalogue";
import type { Timetable } from "@/shared/api/types";
import type { PlannerModule, ModuleIndex } from "@/shared/types/planner";
import type { CustomEvent } from "@/features/planner";

interface LoadPresetParams {
  preset: Timetable;
  semester: string;
  setSemester: (value: string) => void;
  clearTimetable: () => void;
  setCurrentTimetableName: (value: string | null) => void;
  addCustomEvent: (event: CustomEvent) => void;
  setSelectedModules: (modules: PlannerModule[]) => void;
}

/**
 * Loads a saved timetable preset into the planner state.
 */
export const loadTimetablePreset = async ({
  preset,
  semester,
  setSemester,
  clearTimetable,
  setCurrentTimetableName,
  addCustomEvent,
  setSelectedModules,
}: LoadPresetParams) => {
  if (!preset) return;

  clearTimetable();
  setCurrentTimetableName(preset.name);

  if (preset.semester) {
    setSemester(preset.semester);
  }

  if (!preset.selections || !Array.isArray(preset.selections)) return;

  const newModules: PlannerModule[] = [];

  for (const selection of preset.selections) {
    if (selection.isCustomEvent && selection.customEvent) {
      addCustomEvent(selection.customEvent);
      continue;
    }

    try {
      const { moduleCode, indexNumber } = selection;
      if (moduleCode === "CUSTOM") continue;

      const response = await getModuleDetails(moduleCode);
      const moduleData = response.data;

      const targetSemester = preset.semester || semester;
      let indexes: ModuleIndex[] = [];
      try {
        const indexesResponse = await getModuleIndexes(moduleCode, targetSemester);
        indexes = indexesResponse.data || [];
      } catch {
        // Ignore index lookup errors; module details still render.
      }

      if (moduleData) {
        newModules.push({
          ...moduleData,
          selectedIndex: indexNumber,
          indexes,
        });
      }
    } catch {
      // Skip modules that cannot be loaded from the catalogue.
    }
  }

  setSelectedModules(newModules);
};
