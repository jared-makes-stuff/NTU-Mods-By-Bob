import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { GenerationFilters, ModuleForGeneration } from '../../../types/timetable';
import { generateTimetableCombinations, GenerationResult } from '../timetable-generation/generation.service';

export interface PlannerGenerationConstraints {
  moduleCodes?: string[];
  semester?: string;
  preferredDays?: string[];
  avoidDays?: string[];
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  modules?: ModuleForGeneration[];
  filters?: GenerationFilters;
}

const dayKeyMap: Record<string, keyof GenerationFilters['daysOfWeek']> = {
  MON: 'monday',
  TUE: 'tuesday',
  WED: 'wednesday',
  THU: 'thursday',
  FRI: 'friday',
  SAT: 'saturday',
  SUN: 'sunday',
};

function normalizeDay(value: string): keyof GenerationFilters['daysOfWeek'] | undefined {
  const key = value.trim().toUpperCase().slice(0, 3);
  return dayKeyMap[key];
}

function normalizeTimeValue(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return undefined;
  return `${match[1]!.padStart(2, '0')}:${match[2]}`;
}

function buildDefaultFilters(): GenerationFilters {
  return {
    dayDuration: { min: 0, max: 24, enabled: false },
    consecutiveClasses: { min: 0, max: 24, enabled: false },
    gapsBetweenClasses: { min: 0, max: 24, enabled: false },
    dayStartEnd: {
      startAfter: '00:00',
      endBefore: '23:59',
      startEnabled: false,
      endEnabled: false,
    },
    daysOfWeek: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    dailyLoad: { preference: 'balanced', enabled: false },
    classesToConsider: {
      tutorial: true,
      lab: true,
      seminar: true,
      lecture: true,
      project: true,
      design: true,
    },
    venuePreference: { includeOnline: true, includeInPerson: true },
    generationGoals: { balanceWorkload: false, minimizeDays: false, consecutiveDays: false },
  };
}

function applyLegacyConstraints(filters: GenerationFilters, constraints: PlannerGenerationConstraints): GenerationFilters {
  const preferredDays = constraints.preferredDays || [];
  const avoidDays = constraints.avoidDays || [];

  if (preferredDays.length > 0) {
    filters.daysOfWeek = {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    };
    preferredDays.forEach((day) => {
      const key = normalizeDay(day);
      if (key) filters.daysOfWeek[key] = true;
    });
  }

  if (avoidDays.length > 0) {
    avoidDays.forEach((day) => {
      const key = normalizeDay(day);
      if (key) filters.daysOfWeek[key] = false;
    });
  }

  const startAfter = normalizeTimeValue(constraints.preferredTimeStart);
  const endBefore = normalizeTimeValue(constraints.preferredTimeEnd);

  if (startAfter) {
    filters.dayStartEnd.startAfter = startAfter;
    filters.dayStartEnd.startEnabled = true;
  }

  if (endBefore) {
    filters.dayStartEnd.endBefore = endBefore;
    filters.dayStartEnd.endEnabled = true;
  }

  return filters;
}

async function resolveLatestSemester(): Promise<string> {
  const latest = await prisma.module.findFirst({
    select: { semester: true },
    orderBy: { semester: 'desc' },
  });

  if (!latest?.semester) {
    throw new AppError(404, 'SEMESTER_NOT_FOUND', 'No semesters available for generation');
  }

  return latest.semester;
}

async function buildModulesFromCodes(moduleCodes: string[], semester: string): Promise<ModuleForGeneration[]> {
  const normalizedCodes = Array.from(
    new Set(moduleCodes.map((code) => code.trim().toUpperCase()).filter(Boolean))
  );

  if (normalizedCodes.length === 0) {
    return [];
  }

  const indexRows = await prisma.index.findMany({
    where: {
      semester,
      moduleCode: { in: normalizedCodes },
    },
    select: { moduleCode: true, indexNumber: true },
  });

  const indexMap = new Map<string, Set<string>>();
  indexRows.forEach((row) => {
    if (!indexMap.has(row.moduleCode)) {
      indexMap.set(row.moduleCode, new Set<string>());
    }
    indexMap.get(row.moduleCode)!.add(row.indexNumber);
  });

  return normalizedCodes
    .map((code) => ({
      code,
      indexNumbers: Array.from(indexMap.get(code) || []),
    }))
    .filter((module) => module.indexNumbers.length > 0);
}

export async function generatePlannerTimetables(
  constraints: PlannerGenerationConstraints
): Promise<GenerationResult> {
  if (constraints.modules && constraints.filters && constraints.semester) {
    return generateTimetableCombinations({
      modules: constraints.modules,
      filters: constraints.filters,
      semester: constraints.semester,
    });
  }

  const moduleCodes = constraints.moduleCodes || [];
  if (moduleCodes.length === 0) {
    throw new AppError(400, 'INVALID_GENERATION_REQUEST', 'At least one module code is required');
  }

  const semester = constraints.semester || await resolveLatestSemester();
  const modules = await buildModulesFromCodes(moduleCodes, semester);

  if (modules.length === 0) {
    throw new AppError(404, 'MODULES_NOT_FOUND', 'No module indexes found for generation');
  }

  const filters = applyLegacyConstraints(buildDefaultFilters(), constraints);

  return generateTimetableCombinations({
    modules,
    filters,
    semester,
  });
}
