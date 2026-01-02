import { GenerationFilters, TimetableCombination } from './types';
import { shouldConsiderClassType } from '../generation-factors/classTypeFilter';

type CombinationClass = TimetableCombination['classes'][number];

/**
 * Score a timetable combination based on filters.
 */
export function scoreCombination(
  combination: TimetableCombination,
  filters: GenerationFilters
): number {
  let score = 100;

  const classesForScoring = combination.classes.filter(c =>
    shouldConsiderClassType(c.type, filters)
  );

  const classesByDay: Record<string, CombinationClass[]> = {};
  classesForScoring.forEach(c => {
    if (!classesByDay[c.day]) {
      classesByDay[c.day] = [];
    }
    classesByDay[c.day]!.push(c);
  });

  if (filters.dayDuration.enabled) {
    Object.values(classesByDay).forEach(dayClasses => {
      if (dayClasses.length === 0) return;

      const sorted = dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      const firstClass = sorted[0];
      const lastClass = sorted[sorted.length - 1];
      if (!firstClass || !lastClass) return;
      const firstStart = firstClass.startTime;
      const lastEnd = lastClass.endTime;
      const duration = calculateDuration(firstStart, lastEnd);

      if (duration < filters.dayDuration.min || duration > filters.dayDuration.max) {
        score -= 20;
      }
    });
  }

  if (filters.gapsBetweenClasses.enabled) {
    Object.values(classesByDay).forEach(dayClasses => {
      const sorted = dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < sorted.length - 1; i++) {
        const currentClass = sorted[i];
        const nextClass = sorted[i + 1];
        if (!currentClass || !nextClass) continue;
        const gap = calculateDuration(currentClass.endTime, nextClass.startTime);
        if (gap < filters.gapsBetweenClasses.min || gap > filters.gapsBetweenClasses.max) {
          score -= 10;
        }
      }
    });
  }

  if (filters.dailyLoad.enabled) {
    const daysUsed = Object.keys(classesByDay).length;
    if (filters.dailyLoad.preference === 'balanced') {
      score += daysUsed * 5;
    } else {
      score -= daysUsed * 5;
    }
  }

  if (filters.generationGoals) {
    const daysWithClasses = Object.keys(classesByDay);
    const daysUsed = daysWithClasses.length;

    if (filters.generationGoals.minimizeDays) {
      score += (7 - daysUsed) * 20;
    }

    if (filters.generationGoals.balanceWorkload && daysUsed > 0) {
      const classCountsPerDay = Object.values(classesByDay).map(d => d.length);
      const avgClasses = classCountsPerDay.reduce((a, b) => a + b, 0) / daysUsed;
      const variance =
        classCountsPerDay.reduce((sum, count) => sum + Math.pow(count - avgClasses, 2), 0) /
        daysUsed;

      score += Math.max(0, 30 - variance * 10);
    }

    if (filters.generationGoals.consecutiveDays) {
      if (daysUsed <= 1) {
        score += 50;
      } else {
        const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        const usedDayIndices = daysWithClasses
          .map(day => dayOrder.indexOf(day.toUpperCase().substring(0, 3)))
          .filter(idx => idx !== -1)
          .sort((a, b) => a - b);

        let isConsecutive = true;
        for (let i = 0; i < usedDayIndices.length - 1; i++) {
          const currentDay = usedDayIndices[i];
          const nextDay = usedDayIndices[i + 1];
          if (currentDay === undefined || nextDay === undefined) {
            isConsecutive = false;
            break;
          }
          if (nextDay - currentDay !== 1) {
            isConsecutive = false;
            break;
          }
        }

        if (isConsecutive) {
          score += 50;
        } else {
          score -= 10000;
        }
      }
    }
  }

  return score;
}

/**
 * Calculate duration in hours between two times.
 */
function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  return (endMinutes - startMinutes) / 60;
}

function parseTimeToMinutes(time: string): number {
  if (!time) return 0;
  const trimmed = time.trim();
  if (!trimmed) return 0;

  const normalized = trimmed.includes(':')
    ? trimmed
    : `${trimmed.padStart(4, '0').slice(0, 2)}:${trimmed.padStart(4, '0').slice(2)}`;

  const [hourPart, minutePart] = normalized.split(':');
  if (hourPart === undefined || minutePart === undefined) return 0;

  const hours = Number.parseInt(hourPart, 10);
  const minutes = Number.parseInt(minutePart, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;

  return hours * 60 + minutes;
}
