import { parseTime } from "@/shared/lib/timetable-utils";
import type { ModuleWithIndexes } from "./types";

export type CombinationClass = {
  moduleCode: string;
  indexNumber: string;
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  weeks: number[];
};

export type TimetableCombinationInternal = {
  modules: Array<{
    code: string;
    indexNumber: string;
  }>;
  classes: CombinationClass[];
};

const MAX_COMBINATIONS = 1000;
const MAX_RECURSIVE_CALLS = 500000;

const normalizeDay = (day: string): string => day.toUpperCase().substring(0, 3);

const doWeeksOverlap = (weeksA?: number[] | null, weeksB?: number[] | null): boolean => {
  if (!weeksA || weeksA.length === 0) return true;
  if (!weeksB || weeksB.length === 0) return true;
  return weeksA.some((week) => weeksB.includes(week));
};

const hasTimeClash = (class1: CombinationClass, class2: CombinationClass): boolean => {
  if (normalizeDay(class1.day) !== normalizeDay(class2.day)) {
    return false;
  }

  const start1 = parseTime(class1.startTime);
  const end1 = parseTime(class1.endTime);
  const start2 = parseTime(class2.startTime);
  const end2 = parseTime(class2.endTime);

  if (!(start1 < end2 && start2 < end1)) {
    return false;
  }

  return doWeeksOverlap(class1.weeks, class2.weeks);
};

export function generateCombinations(modules: ModuleWithIndexes[]): TimetableCombinationInternal[] {
  if (modules.length === 0) {
    return [];
  }

  const results: TimetableCombinationInternal[] = [];
  let recursiveCallsMade = 0;

  const buildCombination = (
    moduleIndex: number,
    currentCombination: TimetableCombinationInternal["modules"],
    allClasses: CombinationClass[]
  ) => {
    recursiveCallsMade += 1;

    if (recursiveCallsMade >= MAX_RECURSIVE_CALLS || results.length >= MAX_COMBINATIONS) {
      return;
    }

    if (moduleIndex === modules.length) {
      results.push({
        modules: currentCombination,
        classes: allClasses,
      });
      return;
    }

    const currentModule = modules[moduleIndex];
    if (!currentModule) return;

    for (const index of currentModule.indexes) {
      if (recursiveCallsMade >= MAX_RECURSIVE_CALLS || results.length >= MAX_COMBINATIONS) {
        break;
      }

      const indexClasses: CombinationClass[] = index.classes.map((cls) => ({
        moduleCode: currentModule.code,
        indexNumber: index.indexNumber,
        type: cls.type,
        day: cls.day,
        startTime: cls.startTime,
        endTime: cls.endTime,
        venue: cls.venue,
        weeks: cls.weeks,
      }));

      const hasClash = indexClasses.some((newClass) =>
        allClasses.some((existingClass) => hasTimeClash(newClass, existingClass))
      );

      if (!hasClash) {
        buildCombination(
          moduleIndex + 1,
          [
            ...currentCombination,
            {
              code: currentModule.code,
              indexNumber: index.indexNumber,
            },
          ],
          [...allClasses, ...indexClasses]
        );
      }
    }
  };

  buildCombination(0, [], []);

  return results;
}
