import { randomUUID } from 'crypto';
import { AppError } from '../../../api/middleware/error.middleware';
import { validateGenerationRequest } from '../../../api/validators/timetable.validator';
import { validateGeneratedResults } from '../../../api/validators/timetable-result.validator';
import { filterModuleIndexes } from '../../../api/controllers/timetable/generation-factors/filterModuleIndexes';
import { fetchModulesWithIndexes } from '../../../api/controllers/timetable/generation/moduleFetcher';
import { generateCombinations } from '../../../api/controllers/timetable/generation/combinationBuilder';
import { scoreCombination } from '../../../api/controllers/timetable/generation/scoreCombination';
import { GenerationFilters, ModuleForGeneration, TimetableCombination } from '../../../types/timetable';
import { logger } from '../../../config/logger';

export interface GenerationResult {
  combinations: TimetableCombination[];
  generatedAt: string;
  totalCombinations: number;
  returnedCount: number;
  hasMore: boolean;
}

const MAX_RESULTS = 100;

function buildEmptyResponse(): GenerationResult {
  return {
    combinations: [],
    generatedAt: new Date().toISOString(),
    totalCombinations: 0,
    returnedCount: 0,
    hasMore: false,
  };
}

function buildResponse(combinations: TimetableCombination[]): GenerationResult {
  const topCombinations = combinations.slice(0, MAX_RESULTS);
  return {
    combinations: topCombinations,
    generatedAt: new Date().toISOString(),
    totalCombinations: combinations.length,
    returnedCount: topCombinations.length,
    hasMore: combinations.length > MAX_RESULTS,
  };
}

function normalizeTimeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^\d{4}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return trimmed;
  return `${match[1]!.padStart(2, '0')}${match[2]}`;
}

function normalizeFilters(filters: GenerationFilters): GenerationFilters {
  return {
    ...filters,
    dayStartEnd: {
      ...filters.dayStartEnd,
      startAfter: normalizeTimeValue(filters.dayStartEnd.startAfter),
      endBefore: normalizeTimeValue(filters.dayStartEnd.endBefore),
    },
  };
}

function timeToMinutes(time: string): number {
  const h = parseInt(time.substring(0, 2), 10);
  const m = parseInt(time.substring(2), 10);
  return h * 60 + m;
}

function enrichCombination(combo: TimetableCombination): TimetableCombination {
  const classes = combo.classes;
  const days = new Set(classes.map((c) => c.day));

  let totalMinutes = 0;
  let minStart = 2400;
  let maxEnd = 0;

  const byDay: Record<string, typeof classes> = {};

  classes.forEach((c) => {
    const start = parseInt(c.startTime, 10);
    const end = parseInt(c.endTime, 10);
    const startMin = timeToMinutes(c.startTime);
    const endMin = timeToMinutes(c.endTime);

    totalMinutes += endMin - startMin;
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;

    if (!byDay[c.day]) byDay[c.day] = [];
    byDay[c.day]!.push(c);
  });

  let totalGapMinutes = 0;
  let gapCount = 0;

  Object.values(byDay).forEach((dayClasses) => {
    dayClasses.sort((a, b) => parseInt(a.startTime, 10) - parseInt(b.startTime, 10));
    for (let i = 0; i < dayClasses.length - 1; i++) {
      const current = dayClasses[i];
      const next = dayClasses[i + 1];
      if (current && next) {
        const currentEnd = timeToMinutes(current.endTime);
        const nextStart = timeToMinutes(next.startTime);
        if (nextStart > currentEnd) {
          totalGapMinutes += nextStart - currentEnd;
          gapCount++;
        }
      }
    }
  });

  return {
    ...combo,
    id: randomUUID(),
    stats: {
      totalDays: days.size,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      averageGapDuration: gapCount > 0 ? Math.round(totalGapMinutes / gapCount) : 0,
      earliestStart: minStart === 2400 ? '0000' : minStart.toString().padStart(4, '0'),
      latestEnd: maxEnd.toString().padStart(4, '0'),
    },
  };
}

function scoreAndSortCombinations(
  combinations: TimetableCombination[],
  filters: GenerationFilters
): TimetableCombination[] {
  return combinations
    .map((combo) => {
      const enriched = enrichCombination(combo);
      return {
        ...enriched,
        score: scoreCombination(enriched, filters),
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export async function generateTimetableCombinations(params: {
  modules: ModuleForGeneration[];
  filters: GenerationFilters;
  semester: string;
}): Promise<GenerationResult> {
  const { modules, filters, semester } = params;

  const validationResult = validateGenerationRequest({ modules, filters, semester });
  if (!validationResult.valid) {
    throw new AppError(400, 'INVALID_GENERATION_REQUEST', 'Validation failed', validationResult.errors);
  }

  const normalizedFilters = normalizeFilters(filters);

  const modulesWithIndexes = await fetchModulesWithIndexes(modules, semester);
  if (modulesWithIndexes.length === 0) {
    return buildEmptyResponse();
  }

  const filteredModules = filterModuleIndexes(modulesWithIndexes, normalizedFilters);
  if (filteredModules.length === 0 || filteredModules.some((module) => module.indexes.length === 0)) {
    logger.warn('[TimetableGeneration] Some modules have no valid indexes after filtering.');
  }

  const combinations = generateCombinations(filteredModules);
  if (combinations.length === 0) {
    return buildEmptyResponse();
  }

  const resultValidation = validateGeneratedResults(combinations, normalizedFilters, modules);
  if (!resultValidation.valid) {
    throw new AppError(500, 'GENERATED_RESULTS_INVALID', 'Generated timetables failed validation', {
      errors: resultValidation.errors,
      warnings: resultValidation.warnings,
    });
  }

  if (resultValidation.warnings.length > 0) {
    logger.warn('[TimetableGeneration] Generated results have warnings:', resultValidation.warnings);
  }

  const scoredCombinations = scoreAndSortCombinations(combinations, normalizedFilters);
  return buildResponse(scoredCombinations);
}
