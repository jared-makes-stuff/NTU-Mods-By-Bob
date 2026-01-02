import { ModuleWithIndexes, TimetableCombination } from './types';
type CombinationModule = {
  code: string;
  name: string;
  au: number;
  indexNumber: string;
  classes: TimetableCombination['classes'];
};

type CombinationClass = TimetableCombination['classes'][number];

function hasTimeClash(class1: CombinationClass, class2: CombinationClass): boolean {
  const normalizeDay = (day: string): string => {
    if (!day) return '';
    return day.toUpperCase().substring(0, 3);
  };

  if (normalizeDay(class1.day) !== normalizeDay(class2.day)) return false;

  const normalizeTime = (time: string): string => {
    if (!time) return '0000';
    const cleaned = time.replace(':', '').padStart(4, '0');
    return cleaned;
  };

  const start1 = normalizeTime(class1.startTime);
  const end1 = normalizeTime(class1.endTime);
  const start2 = normalizeTime(class2.startTime);
  const end2 = normalizeTime(class2.endTime);

  const isTimeOverlap = !(end1 <= start2 || end2 <= start1);
  if (!isTimeOverlap) return false;

  const getWeeks = (weeks: unknown): number[] => {
    if (!weeks) return [];
    if (Array.isArray(weeks)) {
      return weeks.map((value) => Number(value)).filter((num) => Number.isFinite(num));
    }
    if (typeof weeks === 'string') {
      return weeks
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
    }
    return [];
  };

  const weeks1 = getWeeks(class1.weeks);
  const weeks2 = getWeeks(class2.weeks);

  if (weeks1.length === 0 || weeks2.length === 0) return true;

  return weeks1.some(w => weeks2.includes(w));
}

/**
 * Generate all valid combinations using dynamic programming.
 */
export function generateCombinations(modules: ModuleWithIndexes[]): TimetableCombination[] {
  if (modules.length === 0) {
    return [];
  }

  const results: TimetableCombination[] = [];
  const MAX_COMBINATIONS = 1000;
  const MAX_RECURSIVE_CALLS = 500000;
  let recursiveCallsMade = 0;

  function buildCombination(
    moduleIndex: number,
    currentCombination: CombinationModule[],
    allClasses: CombinationClass[]
  ) {
    recursiveCallsMade++;

    if (recursiveCallsMade >= MAX_RECURSIVE_CALLS) {
      return;
    }

    if (results.length >= MAX_COMBINATIONS) {
      return;
    }

    if (moduleIndex === modules.length) {
      results.push({
        modules: currentCombination.map(m => ({
          code: m.code,
          name: m.name,
          au: m.au,
          indexNumber: m.indexNumber,
        })),
        classes: allClasses,
      });
      return;
    }

    const currentModule = modules[moduleIndex];
    if (!currentModule) {
      return;
    }

    for (const index of currentModule.indexes) {
      if (recursiveCallsMade >= MAX_RECURSIVE_CALLS || results.length >= MAX_COMBINATIONS) {
        break;
      }

      const indexClasses: CombinationClass[] = index.classes.map(c => ({
        moduleCode: currentModule.code,
        moduleName: currentModule.name,
        indexNumber: index.indexNumber,
        type: c.type,
        day: c.day,
        startTime: c.startTime,
        endTime: c.endTime,
        venue: c.venue,
        weeks: c.weeks.join(','),
      }));

      const hasClash = indexClasses.some(newClass =>
        allClasses.some(existingClass => hasTimeClash(newClass, existingClass))
      );

      if (!hasClash) {
        buildCombination(
          moduleIndex + 1,
          [
            ...currentCombination,
            {
              code: currentModule.code,
              name: currentModule.name,
              au: currentModule.au,
              indexNumber: index.indexNumber,
              classes: indexClasses,
            },
          ],
          [...allClasses, ...indexClasses]
        );
      }
    }
  }

  buildCombination(0, [], []);

  return results;
}



