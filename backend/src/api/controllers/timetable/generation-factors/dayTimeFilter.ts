import { ClassItem, GenerationFilters } from '../generation/types';

/**
 * Enforce day start/end time boundaries.
 */
export function passesDayTimeConstraints(
  classes: ClassItem[],
  filters: GenerationFilters
): boolean {
  if (!filters.dayStartEnd.startEnabled && !filters.dayStartEnd.endEnabled) {
    return true;
  }

  const violatesTimeConstraint = classes.some(classItem => {
    if (filters.dayStartEnd.startEnabled && classItem.startTime < filters.dayStartEnd.startAfter) {
      return true;
    }
    if (filters.dayStartEnd.endEnabled && classItem.endTime > filters.dayStartEnd.endBefore) {
      return true;
    }
    return false;
  });

  return !violatesTimeConstraint;
}
