import { ClassItem, GenerationFilters } from '../generation/types';

/**
 * Enforce selected days of the week.
 */
export function passesDayOfWeekConstraints(
  classes: ClassItem[],
  filters: GenerationFilters
): boolean {
  const allDaysSelected =
    filters.daysOfWeek.monday &&
    filters.daysOfWeek.tuesday &&
    filters.daysOfWeek.wednesday &&
    filters.daysOfWeek.thursday &&
    filters.daysOfWeek.friday &&
    filters.daysOfWeek.saturday &&
    filters.daysOfWeek.sunday;

  if (allDaysSelected) {
    return true;
  }

  const dayMap: { [key: string]: keyof typeof filters.daysOfWeek } = {
    MON: 'monday',
    TUE: 'tuesday',
    WED: 'wednesday',
    THU: 'thursday',
    FRI: 'friday',
    SAT: 'saturday',
    SUN: 'sunday',
  };

  const hasClassOnDisabledDay = classes.some(classItem => {
    const normalizedDay = classItem.day.toUpperCase().substring(0, 3);
    const dayKey = dayMap[normalizedDay];
    const isDayEnabled = dayKey ? filters.daysOfWeek[dayKey] : false;
    return !isDayEnabled;
  });

  return !hasClassOnDisabledDay;
}
