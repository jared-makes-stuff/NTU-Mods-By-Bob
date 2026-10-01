import { GenerationFilters, ModuleForGeneration } from './types';

export function validateModule(module: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Module[${index}]`;

  if (!module || typeof module !== 'object') {
    errors.push(`${prefix}: Module object is null or undefined`);
    return errors;
  }

  const candidate = module as Partial<ModuleForGeneration>;

  if (!candidate.code || typeof candidate.code !== 'string') {
    errors.push(`${prefix}: Module code must be a non-empty string`);
  } else if (!candidate.code.trim()) {
    errors.push(`${prefix}: Module code cannot be empty or whitespace`);
  } else if (!/^[A-Z]{2,3}\d{4}[A-Z]?$/i.test(candidate.code)) {
    errors.push(`${prefix}: Module code '${candidate.code}' has invalid format (expected format: AB1234 or ABC1234)`);
  }

  if (!candidate.indexNumbers || !Array.isArray(candidate.indexNumbers)) {
    errors.push(`${prefix}: indexNumbers must be a non-empty array`);
  } else if (candidate.indexNumbers.length === 0) {
    errors.push(`${prefix}: At least one index number must be provided`);
  } else {
    candidate.indexNumbers.forEach((indexNum, idx: number) => {
      if (typeof indexNum !== 'string') {
        errors.push(`${prefix}.indexNumbers[${idx}]: Index number must be a string`);
      } else if (!indexNum.trim()) {
        errors.push(`${prefix}.indexNumbers[${idx}]: Index number cannot be empty`);
      } else if (!/^\d{5}$/.test(indexNum)) {
        errors.push(`${prefix}.indexNumbers[${idx}]: Index number '${indexNum}' has invalid format (expected 5 digits)`);
      }
    });

    const uniqueIndexes = new Set(candidate.indexNumbers);
    if (uniqueIndexes.size !== candidate.indexNumbers.length) {
      errors.push(`${prefix}: Duplicate index numbers found`);
    }
  }

  return errors;
}

export function validateFilters(filters: unknown): string[] {
  const errors: string[] = [];

  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    errors.push('Filters must be an object');
    return errors;
  }

  const candidate = filters as Partial<GenerationFilters>;

  if (candidate.dayDuration) {
    if (typeof candidate.dayDuration.min !== 'number' || candidate.dayDuration.min < 0) {
      errors.push('dayDuration.min must be a non-negative number');
    }
    if (typeof candidate.dayDuration.max !== 'number' || candidate.dayDuration.max < 0) {
      errors.push('dayDuration.max must be a non-negative number');
    }
    if (candidate.dayDuration.min > candidate.dayDuration.max) {
      errors.push('dayDuration.min cannot be greater than dayDuration.max');
    }
  }

  if (candidate.consecutiveClasses) {
    if (typeof candidate.consecutiveClasses.min !== 'number' || candidate.consecutiveClasses.min < 0) {
      errors.push('consecutiveClasses.min must be a non-negative number');
    }
    if (typeof candidate.consecutiveClasses.max !== 'number' || candidate.consecutiveClasses.max < 0) {
      errors.push('consecutiveClasses.max must be a non-negative number');
    }
    if (candidate.consecutiveClasses.min > candidate.consecutiveClasses.max) {
      errors.push('consecutiveClasses.min cannot be greater than consecutiveClasses.max');
    }
  }

  if (candidate.gapsBetweenClasses) {
    if (typeof candidate.gapsBetweenClasses.min !== 'number' || candidate.gapsBetweenClasses.min < 0) {
      errors.push('gapsBetweenClasses.min must be a non-negative number');
    }
    if (typeof candidate.gapsBetweenClasses.max !== 'number' || candidate.gapsBetweenClasses.max < 0) {
      errors.push('gapsBetweenClasses.max must be a non-negative number');
    }
    if (candidate.gapsBetweenClasses.min > candidate.gapsBetweenClasses.max) {
      errors.push('gapsBetweenClasses.min cannot be greater than gapsBetweenClasses.max');
    }
  }

  if (candidate.dayStartEnd) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (candidate.dayStartEnd.startAfter && !timeRegex.test(candidate.dayStartEnd.startAfter)) {
      errors.push(`dayStartEnd.startAfter '${candidate.dayStartEnd.startAfter}' has invalid time format (expected HH:MM)`);
    }
    if (candidate.dayStartEnd.endBefore && !timeRegex.test(candidate.dayStartEnd.endBefore)) {
      errors.push(`dayStartEnd.endBefore '${candidate.dayStartEnd.endBefore}' has invalid time format (expected HH:MM)`);
    }
  }

  if (candidate.daysOfWeek) {
    const days: Array<keyof GenerationFilters['daysOfWeek']> = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    days.forEach((day) => {
      if (typeof candidate.daysOfWeek?.[day] !== 'boolean') {
        errors.push(`daysOfWeek.${day} must be a boolean`);
      }
    });
  }

  if (candidate.classesToConsider) {
    const classTypes: Array<keyof GenerationFilters['classesToConsider']> = [
      'tutorial',
      'lab',
      'seminar',
      'lecture',
      'project',
      'design',
    ];
    classTypes.forEach((type) => {
      if (typeof candidate.classesToConsider?.[type] !== 'boolean') {
        errors.push(`classesToConsider.${type} must be a boolean`);
      }
    });

    const hasAnySelected = classTypes.some((type) => candidate.classesToConsider?.[type] === true);
    if (!hasAnySelected) {
      errors.push('At least one class type must be selected in classesToConsider');
    }
  }

  if (candidate.venuePreference) {
    if (typeof candidate.venuePreference.includeOnline !== 'boolean') {
      errors.push('venuePreference.includeOnline must be a boolean');
    }
    if (typeof candidate.venuePreference.includeInPerson !== 'boolean') {
      errors.push('venuePreference.includeInPerson must be a boolean');
    }

    if (!candidate.venuePreference.includeOnline && !candidate.venuePreference.includeInPerson) {
      errors.push('At least one venue type must be selected in venuePreference');
    }
  }

  if (candidate.dailyLoad) {
    if (candidate.dailyLoad.preference !== 'skewed' && candidate.dailyLoad.preference !== 'balanced') {
      errors.push(`dailyLoad.preference must be either 'skewed' or 'balanced', got '${candidate.dailyLoad.preference}'`);
    }
  }

  if (candidate.generationGoals) {
    if (typeof candidate.generationGoals.balanceWorkload !== 'boolean') {
      errors.push('generationGoals.balanceWorkload must be a boolean');
    }
    if (typeof candidate.generationGoals.minimizeDays !== 'boolean') {
      errors.push('generationGoals.minimizeDays must be a boolean');
    }
    if (typeof candidate.generationGoals.consecutiveDays !== 'boolean') {
      errors.push('generationGoals.consecutiveDays must be a boolean');
    }
  }

  return errors;
}
