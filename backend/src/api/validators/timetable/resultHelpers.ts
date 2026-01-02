import { GenerationFilters, TimetableCombination } from './types';

type CombinationClass = TimetableCombination['classes'][number];

export function shouldConsiderClassType(classType: string, filters: GenerationFilters): boolean {
  const normalizedType = classType.toUpperCase();

  if (normalizedType.includes('TUT')) return filters.classesToConsider.tutorial;
  if (normalizedType.includes('LAB')) return filters.classesToConsider.lab;
  if (normalizedType.includes('SEM')) return filters.classesToConsider.seminar;
  if (normalizedType.includes('LEC')) return filters.classesToConsider.lecture;
  if (normalizedType.includes('PRJ') || normalizedType.includes('PROJ')) return filters.classesToConsider.project;
  if (normalizedType.includes('DES')) return filters.classesToConsider.design;

  return true;
}

export function normalizeDay(day: string): string {
  if (!day) return '';
  return day.toUpperCase().substring(0, 3);
}

export function timeToMinutes(time: string): number {
  if (!time) return 0;

  let timeStr = time.trim();
  if (timeStr.length === 4 && !timeStr.includes(':')) {
    timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
  }

  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;

  const hourPart = parts[0];
  const minPart = parts[1];

  if (hourPart === undefined || minPart === undefined) return 0;

  const hours = parseInt(hourPart, 10);
  const minutes = parseInt(minPart, 10);

  if (isNaN(hours) || isNaN(minutes)) return 0;

  return hours * 60 + minutes;
}

export function isOnlineVenue(venue: string): boolean {
  const normalized = venue.toLowerCase();
  return normalized.includes('online') || normalized.includes('zoom') || normalized.includes('teams');
}

export function hasTimeClash(class1: CombinationClass, class2: CombinationClass): boolean {
  const day1 = normalizeDay(class1.day);
  const day2 = normalizeDay(class2.day);

  if (day1 !== day2) return false;

  const start1 = timeToMinutes(class1.startTime);
  const end1 = timeToMinutes(class1.endTime);
  const start2 = timeToMinutes(class2.startTime);
  const end2 = timeToMinutes(class2.endTime);

  const timeOverlap = start1 < end2 && start2 < end1;
  if (!timeOverlap) return false;

  const getWeeks = (weeks: unknown): number[] => {
    if (!weeks) return [];
    if (Array.isArray(weeks)) {
      return weeks.map((value) => Number(value)).filter((num) => Number.isFinite(num));
    }
    if (typeof weeks === 'string') {
      return weeks.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    }
    return [];
  };

  const weeks1 = getWeeks(class1.weeks);
  const weeks2 = getWeeks(class2.weeks);

  if (weeks1.length === 0 || weeks2.length === 0) return true;

  return weeks1.some((week) => weeks2.includes(week));
}
