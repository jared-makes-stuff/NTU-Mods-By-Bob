import type { GenerationFilters } from "@/shared/types/timetableGeneration";
import type { TimetableCombination } from "@/shared/api/timetable";

export type { GenerationFilters, TimetableCombination };

export type ClassItem = {
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  weeks: number[];
};

export type IndexWithClasses = {
  indexNumber: string;
  classes: ClassItem[];
};

export type ModuleWithIndexes = {
  code: string;
  name: string;
  au: number;
  indexes: IndexWithClasses[];
};

export type GenerationResult = {
  combinations: TimetableCombination[];
  generatedAt: string;
  totalCombinations: number;
  returnedCount: number;
  hasMore: boolean;
};
