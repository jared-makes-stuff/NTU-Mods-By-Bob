import { GenerationFilters, ModuleForGeneration, TimetableCombination } from '../../../../types/timetable';

export type { GenerationFilters, ModuleForGeneration, TimetableCombination };

export interface ClassItem {
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  weeks: number[];
}

export interface IndexWithClasses {
  indexNumber: string;
  classes: ClassItem[];
}

export interface ModuleWithIndexes {
  code: string;
  name: string;
  au: number;
  indexes: IndexWithClasses[];
}
