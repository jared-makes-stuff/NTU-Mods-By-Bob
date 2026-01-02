import { getModuleIndexes } from "@/shared/api/catalogue";
import type { PlannerModule } from "@/shared/types/planner";

interface SyncModuleIndexesParams {
  semester: string;
  selectedModules: PlannerModule[];
  setSelectedModules: (modules: PlannerModule[]) => void;
}

/**
 * Syncs module indexes when the semester changes.
 */
export const syncModuleIndexesForSemester = async ({
  semester,
  selectedModules,
  setSelectedModules,
}: SyncModuleIndexesParams) => {
  const updatedModules = [...selectedModules];
  let hasChanges = false;

  for (let i = 0; i < updatedModules.length; i += 1) {
    const moduleEntry = updatedModules[i];
    try {
      const indexesResponse = await getModuleIndexes(moduleEntry.code, semester);
      const indexes = indexesResponse.data || [];

      if (JSON.stringify(moduleEntry.indexes) !== JSON.stringify(indexes)) {
        const preservedIndex =
          moduleEntry.selectedIndex && indexes.some((idx) => idx.indexNumber === moduleEntry.selectedIndex)
            ? moduleEntry.selectedIndex
            : undefined;

        updatedModules[i] = { ...moduleEntry, indexes, selectedIndex: preservedIndex };
        hasChanges = true;
      }
    } catch {
      if (moduleEntry.indexes && moduleEntry.indexes.length > 0) {
        updatedModules[i] = { ...moduleEntry, indexes: [], selectedIndex: undefined };
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    setSelectedModules(updatedModules);
  }
};
