import type { PlannerModule, ModuleIndex } from "@/shared/types/planner";
import type { TimetableCombination } from "@/shared/api/timetable";
import type { GenerationFilters } from "../types";
import type { ModuleWithIndexes } from "../generation/types";
import { generateTimetableCombinations } from "../generation/generateTimetables";

/**
 * Prepares modules for timetable generation based on selected indexes.
 */
export const buildModulesForGeneration = (
  selectedModules: PlannerModule[],
  selectedIndexesForGeneration: Set<string>
): ModuleWithIndexes[] => {
  return selectedModules
    .filter((module) => module.indexes && module.indexes.length > 0)
    .map((module) => {
      const explicitlySelectedIndexes = Array.from(selectedIndexesForGeneration)
        .filter((key) => key.startsWith(`${module.code}-`))
        .map((key) => key.split("-")[1])
        .filter(Boolean) as string[];

      const indexMap = new Map<string, ModuleIndex[]>();
      module.indexes?.forEach((idx) => {
        if (!indexMap.has(idx.indexNumber)) {
          indexMap.set(idx.indexNumber, []);
        }
        indexMap.get(idx.indexNumber)!.push(idx);
      });

      let groupedIndexes = Array.from(indexMap.entries()).map(([indexNumber, classes]) => ({
        indexNumber,
        classes: classes.map((cls) => ({
          type: cls.type,
          day: cls.day,
          startTime: cls.startTime,
          endTime: cls.endTime,
          venue: cls.venue ?? "",
          weeks: cls.weeks ?? [],
        })),
      }));

      if (explicitlySelectedIndexes.length > 0) {
        groupedIndexes = groupedIndexes.filter((idx) => explicitlySelectedIndexes.includes(idx.indexNumber));
      }

      return {
        code: module.code,
        name: module.name,
        au: Number(module.au) || 0,
        indexes: groupedIndexes,
      };
    })
    .filter((module) => module.indexes.length > 0);
};

/**
 * Runs timetable generation and returns the combinations.
 */
export const runTimetableGeneration = (params: {
  modules: ModuleWithIndexes[];
  filters: GenerationFilters;
}): {
  combinations: TimetableCombination[];
  returnedCount: number;
  hasMore: boolean;
} => {
  return generateTimetableCombinations({
    modules: params.modules,
    filters: params.filters,
  });
};

/**
 * Applies a generated timetable to current module selections.
 */
export const applyGeneratedTimetable = (
  generatedTimetables: TimetableCombination[],
  currentTimetableIndex: number,
  selectedModules: PlannerModule[]
): { updatedModules: PlannerModule[]; hasChanges: boolean } => {
  const currentTimetable = generatedTimetables[currentTimetableIndex];
  if (!currentTimetable || !currentTimetable.modules) {
    return { updatedModules: selectedModules, hasChanges: false };
  }

  let hasChanges = false;
  const updatedModules = selectedModules.map((module) => {
    const timetableModule = currentTimetable.modules.find((tm) => tm.code === module.code);
    if (timetableModule && module.selectedIndex !== timetableModule.indexNumber) {
      hasChanges = true;
      return { ...module, selectedIndex: timetableModule.indexNumber };
    }
    return module;
  });

  return { updatedModules, hasChanges };
};
