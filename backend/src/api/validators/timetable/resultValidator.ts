import { join } from 'path';
import { writeValidationLog } from './loggers';
import { GenerationFilters, ModuleForGeneration, ResultValidationResult, TimetableCombination } from './types';
import { hasTimeClash, isOnlineVenue, normalizeDay, shouldConsiderClassType, timeToMinutes } from './resultHelpers';

const resultValidationLogPath = join(__dirname, '../../../../logs/timetable-result-validation.log');

export function validateGeneratedResults(
  combinations: TimetableCombination[],
  filters: GenerationFilters,
  requestedModules: ModuleForGeneration[]
): ResultValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (combinations.length === 0) {
    warnings.push('No combinations generated - all indexes may have been filtered out');
    return { valid: true, errors, warnings };
  }

  combinations.forEach((combo, comboIndex) => {
    const comboErrors = validateCombination(combo, filters, comboIndex);
    errors.push(...comboErrors);
  });

  requestedModules.forEach((requestedModule) => {
    const hasCombinationWithModule = combinations.some((combo) =>
      combo.modules.some((mod) => mod.code === requestedModule.code)
    );

    if (!hasCombinationWithModule) {
      warnings.push(`Module ${requestedModule.code} does not appear in any generated combination`);
    }
  });

  if (errors.length > 0) {
    writeValidationLog(
      resultValidationLogPath,
      'RESULT VALIDATION ERROR',
      `Found ${errors.length} validation error(s) in generated results`,
      {
        errors,
        warnings,
        combinationCount: combinations.length,
        filters,
        requestedModules,
      }
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateCombination(
  combo: TimetableCombination,
  filters: GenerationFilters,
  comboIndex: number
): string[] {
  const errors: string[] = [];
  const prefix = `Combination[${comboIndex}]`;

  const allClasses = combo.classes;

  for (let i = 0; i < allClasses.length; i++) {
    const class1 = allClasses[i];
    if (!class1) continue;

    for (let j = i + 1; j < allClasses.length; j++) {
      const class2 = allClasses[j];
      if (!class2) continue;

      if (hasTimeClash(class1, class2)) {
        errors.push(
          `${prefix}: Time clash detected between ${class1.moduleCode} (${class1.type} on ${class1.day} ${class1.startTime}-${class1.endTime}) ` +
          `and ${class2.moduleCode} (${class2.type} on ${class2.day} ${class2.startTime}-${class2.endTime})`
        );
      }
    }
  }

  const consideredClasses = allClasses.filter((cls) => shouldConsiderClassType(cls.type, filters));

  const allDaysSelected = filters.daysOfWeek.monday && filters.daysOfWeek.tuesday &&
    filters.daysOfWeek.wednesday && filters.daysOfWeek.thursday &&
    filters.daysOfWeek.friday && filters.daysOfWeek.saturday &&
    filters.daysOfWeek.sunday;

  if (!allDaysSelected) {
    consideredClasses.forEach((cls) => {
      const day = normalizeDay(cls.day);
      const dayMap: { [key: string]: keyof typeof filters.daysOfWeek } = {
        MON: 'monday',
        TUE: 'tuesday',
        WED: 'wednesday',
        THU: 'thursday',
        FRI: 'friday',
        SAT: 'saturday',
        SUN: 'sunday',
      };

      const dayKey = dayMap[day];
      if (dayKey && !filters.daysOfWeek[dayKey]) {
        errors.push(
          `${prefix}: Class ${cls.moduleCode} ${cls.type} on ${cls.day} violates day filter (${day} not selected)`
        );
      }
    });
  }

  const venueFilterActive = !filters.venuePreference.includeOnline || !filters.venuePreference.includeInPerson;

  if (venueFilterActive) {
    consideredClasses.forEach((cls) => {
      const online = isOnlineVenue(cls.venue);

      if (online && !filters.venuePreference.includeOnline) {
        errors.push(
          `${prefix}: Class ${cls.moduleCode} ${cls.type} has online venue '${cls.venue}' but online classes are not allowed`
        );
      }

      if (!online && !filters.venuePreference.includeInPerson) {
        errors.push(
          `${prefix}: Class ${cls.moduleCode} ${cls.type} has in-person venue '${cls.venue}' but in-person classes are not allowed`
        );
      }
    });
  }

  if (filters.dayStartEnd.startEnabled) {
    const startAfter = timeToMinutes(filters.dayStartEnd.startAfter);
    consideredClasses.forEach((cls) => {
      const classStart = timeToMinutes(cls.startTime);
      if (classStart < startAfter) {
        errors.push(
          `${prefix}: Class ${cls.moduleCode} ${cls.type} starts at ${cls.startTime}, before allowed start time ${filters.dayStartEnd.startAfter}`
        );
      }
    });
  }

  if (filters.dayStartEnd.endEnabled) {
    const endBefore = timeToMinutes(filters.dayStartEnd.endBefore);
    consideredClasses.forEach((cls) => {
      const classEnd = timeToMinutes(cls.endTime);
      if (classEnd > endBefore) {
        errors.push(
          `${prefix}: Class ${cls.moduleCode} ${cls.type} ends at ${cls.endTime}, after allowed end time ${filters.dayStartEnd.endBefore}`
        );
      }
    });
  }

  return errors;
}
