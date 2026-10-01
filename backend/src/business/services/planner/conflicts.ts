import { prisma } from '../../../config/database';
import { logger } from '../../../config/logger';
import { getTimetableById } from './timetables';
import { PlannerSelection } from './types';

interface ConflictSlot {
  moduleCode?: string;
  indexNumber?: string;
  type?: string;
  title?: string;
  day: string;
  startTime: string;
  endTime: string;
  weeks?: number[];
  source: 'module' | 'custom';
}

export interface TimetableConflict {
  slot1: ConflictSlot;
  slot2: ConflictSlot;
  reason: string;
}

function normalizeTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return null;
  return `${match[1]!.padStart(2, '0')}${match[2]}`;
}

function timeToMinutes(value: string): number | null {
  const normalized = normalizeTime(value);
  if (!normalized) return null;
  const hours = parseInt(normalized.slice(0, 2), 10);
  const minutes = parseInt(normalized.slice(2), 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function parseWeeks(value: unknown): number[] | undefined {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((num) => Number.isFinite(num));
  }

  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const weeks = new Set<number>();
  trimmed.split(',').forEach((segment) => {
    const part = segment.trim();
    if (!part) return;
    if (part.includes('-')) {
      const [startRaw, endRaw] = part.split('-');
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let week = min; week <= max; week += 1) {
          weeks.add(week);
        }
      }
      return;
    }
    const valueNum = Number(part);
    if (Number.isFinite(valueNum)) {
      weeks.add(valueNum);
    }
  });

  return weeks.size > 0 ? Array.from(weeks).sort((a, b) => a - b) : undefined;
}

function weeksOverlap(a?: number[], b?: number[]): boolean {
  if (!a || !b) return true;
  const set = new Set(a);
  return b.some((week) => set.has(week));
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const startA = timeToMinutes(aStart);
  const endA = timeToMinutes(aEnd);
  const startB = timeToMinutes(bStart);
  const endB = timeToMinutes(bEnd);

  if (startA === null || endA === null || startB === null || endB === null) {
    return false;
  }

  return startA < endB && startB < endA;
}

function slotLabel(slot: ConflictSlot): string {
  if (slot.source === 'custom') {
    return slot.title || 'Custom event';
  }
  return [slot.moduleCode, slot.indexNumber].filter(Boolean).join(' ');
}

export async function detectTimetableConflicts(
  timetableId: string,
  userId: string
): Promise<{ hasConflict: boolean; hasConflicts: boolean; conflicts: TimetableConflict[] }> {
  const timetable = await getTimetableById(timetableId, userId);
  const selections: PlannerSelection[] = Array.isArray(timetable.selections)
    ? (timetable.selections as PlannerSelection[])
    : [];
  const semester = timetable.semester;

  const selectedIndexes = selections.filter(
    (selection) => selection && !selection.isCustomEvent && selection.moduleCode && selection.indexNumber
  );

  const indexConditions = selectedIndexes.map((selection) => ({
    moduleCode: String(selection.moduleCode).toUpperCase(),
    indexNumber: String(selection.indexNumber),
  }));

  let indexSlots: ConflictSlot[] = [];
  if (indexConditions.length > 0) {
    const indexRecords = await prisma.index.findMany({
      where: {
        semester,
        OR: indexConditions,
      },
      orderBy: [
        { moduleCode: 'asc' },
        { indexNumber: 'asc' },
        { type: 'asc' },
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    indexSlots = indexRecords.map((record) => ({
      moduleCode: record.moduleCode,
      indexNumber: record.indexNumber,
      type: record.type,
      day: record.day,
      startTime: record.startTime,
      endTime: record.endTime,
      weeks: record.weeks,
      source: 'module',
    }));
  }

  const customSlots: ConflictSlot[] = selections
    .filter((selection) => selection && (selection.isCustomEvent || selection.customEvent))
    .map((selection) => {
      const event = selection.customEvent || {};
      return {
        title: event.title || selection.title || 'Custom event',
        day: event.day || selection.day || '',
        startTime: event.startTime || selection.startTime || '',
        endTime: event.endTime || selection.endTime || '',
        weeks: parseWeeks(event.weeks || selection.weeks),
        source: 'custom' as const,
      };
    })
    .filter((slot) => slot.day && slot.startTime && slot.endTime);

  const slots = [...indexSlots, ...customSlots];
  if (slots.length <= 1) {
    return { hasConflict: false, hasConflicts: false, conflicts: [] };
  }

  const conflicts: TimetableConflict[] = [];

  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const slotA = slots[i]!;
      const slotB = slots[j]!;

      if (slotA.day !== slotB.day) continue;
      if (!weeksOverlap(slotA.weeks, slotB.weeks)) continue;
      if (!timesOverlap(slotA.startTime, slotA.endTime, slotB.startTime, slotB.endTime)) continue;

      const reason = `Time overlap on ${slotA.day} between ${slotLabel(slotA)} and ${slotLabel(slotB)}`;
      conflicts.push({ slot1: slotA, slot2: slotB, reason });
    }
  }

  if (indexConditions.length === 0 && customSlots.length === 0 && selections.length > 0) {
    logger.warn('[PlannerConflicts] Timetable selections missing index numbers; skipping conflict checks.');
  }

  return {
    hasConflict: conflicts.length > 0,
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
