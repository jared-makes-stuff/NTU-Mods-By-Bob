import { GenerationFilters, ModuleForGeneration, TimetableCombination } from '../../../types/timetable';

export type { GenerationFilters, ModuleForGeneration, TimetableCombination };

export interface RequestValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ResultValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
