import type { CustomEvent } from "@/features/planner";
import type { PlannerModule } from "@/shared/types/planner";
import type { IndexData } from "@/shared/types/timetable";
import { formatWeeks } from "../utils";

interface ActiveIndexesParams {
  selectedModules: PlannerModule[];
  previewingModuleCode: string | null;
  customEvents: CustomEvent[];
}

/**
 * Builds active timetable indexes from selected modules and custom events.
 */
export const buildActiveIndexes = ({
  selectedModules,
  previewingModuleCode,
  customEvents,
}: ActiveIndexesParams): IndexData[] => {
  const allIndexes: IndexData[] = [];

  selectedModules.forEach((module) => {
    if (module.code === previewingModuleCode) return;

    if (module.selectedIndex && module.indexes) {
      const selectedClasses = module.indexes.filter((idx) => idx.indexNumber === module.selectedIndex);

      const mappedClasses: IndexData[] = selectedClasses.map((cls) => ({
        indexNumber: cls.indexNumber,
        type: cls.type,
        day: cls.day,
        startTime: cls.startTime,
        endTime: cls.endTime,
        venue: cls.venue || "",
        moduleCode: module.code,
        weeks: formatWeeks(cls.weeks),
      }));

      allIndexes.push(...mappedClasses);
    }
  });

  customEvents.forEach((event) => {
    allIndexes.push({
      indexNumber: event.id,
      type: "EVENT",
      day: event.day,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: "Custom",
      moduleCode: event.title,
      weeks: "All weeks",
      isCustomEvent: true,
    });
  });

  return allIndexes;
};

/**
 * Builds preview indexes for the currently hovered module.
 */
export const buildActivePreviewIndexes = (
  selectedModules: PlannerModule[],
  previewingModuleCode: string | null
): IndexData[] => {
  if (!previewingModuleCode) return [];

  const targetModule = selectedModules.find((module) => module.code === previewingModuleCode);
  if (!targetModule || !targetModule.indexes) return [];

  return targetModule.indexes.map((cls) => ({
    indexNumber: cls.indexNumber,
    type: cls.type,
    day: cls.day,
    startTime: cls.startTime,
    endTime: cls.endTime,
    venue: cls.venue || "",
    moduleCode: targetModule.code,
    weeks: formatWeeks(cls.weeks),
  }));
};

/**
 * Computes total AU count for selected modules.
 */
export const calculateTotalAus = (selectedModules: PlannerModule[]): number => {
  return selectedModules.reduce((total, module) => total + (Number(module.au) || 0), 0);
};
