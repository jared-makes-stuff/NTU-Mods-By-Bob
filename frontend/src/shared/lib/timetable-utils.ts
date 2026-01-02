/**
 * Timetable Utilities
 *
 * Shared utility functions for timetable components and planner logic.
 * Handles time parsing, week parsing, clash detection, and layout helpers.
 *
 * Used by:
 * - TimetableDisplay.tsx
 * - TimetablePreview.tsx
 * - Timetable planner and module-info previews
 */

import type { IndexData } from "@/shared/types/timetable";

/**
 * Parse Time String to Minutes
 * 
 * Converts time strings in various formats to minutes since midnight.
 * Handles both 24-hour formats with or without colons.
 * 
 * @param {string} timeStr - Time string (e.g., '0900', '09:00', '930')
 * @returns {number} Minutes since midnight (e.g., 540 for 09:00)
 * 
 * @example
 * parseTime('0900')   // Returns 540 (9 * 60)
 * parseTime('09:30')  // Returns 570 (9 * 60 + 30)
 * parseTime('1330')   // Returns 810 (13 * 60 + 30)
 * parseTime('830')    // Returns 510 (8 * 60 + 30) - padded to 0830
 */
export function parseTime(timeStr: string): number {
  const cleaned = timeStr.replace(':', '').padStart(4, '0');
  const hours = parseInt(cleaned.substring(0, 2));
  const minutes = parseInt(cleaned.substring(2, 4));
  return hours * 60 + minutes;
}

/**
 * Convert Time to Timetable Slot Index
 * 
 * Maps a time string to its corresponding slot index in the timetable grid.
 * Slot 0 = 08:00, Slot 1 = 08:30, etc. Each slot is 30 minutes.
 * 
 * @param {string} timeStr - Time string (e.g., '0900', '09:00')
 * @returns {number} Slot index (0-based)
 * 
 * @example
 * timeToSlot('0800') // Returns 0
 * timeToSlot('0830') // Returns 1
 * timeToSlot('0900') // Returns 2
 * timeToSlot('1400') // Returns 12 (6 hours * 2 slots per hour)
 */
export function timeToSlot(timeStr: string): number {
  const minutes = parseTime(timeStr);
  const startMinutes = parseTime('0800'); // Timetable starts at 08:00
  return Math.floor((minutes - startMinutes) / 30);
}

/**
 * Calculate Slot Span for Class Duration
 * 
 * Determines how many 30-minute slots a class spans based on
 * its start and end times. Used for cell rowSpan in the timetable.
 * 
 * @param {string} startTime - Class start time (e.g., '0900')
 * @param {string} endTime - Class end time (e.g., '1100')
 * @returns {number} Number of slots (each 30 minutes)
 * 
 * @example
 * calculateSpan('0900', '1100') // Returns 4 (2 hours = 4 slots)
 * calculateSpan('1400', '1500') // Returns 2 (1 hour = 2 slots)
 * calculateSpan('0900', '0950') // Returns 2 (50 mins rounded up to 1 hour)
 */
export function calculateSpan(startTime: string, endTime: string): number {
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  return Math.ceil((endMinutes - startMinutes) / 30);
}

/**
 * Format Time for Display
 * 
 * Converts time string to human-readable format with colon.
 * 
 * @param {string} timeStr - Time string (e.g., '0900', '09:00')
 * @returns {string} Formatted time (e.g., '09:00')
 * 
 * @example
 * formatTime('0900')  // Returns '09:00'
 * formatTime('09:00') // Returns '09:00'
 * formatTime('1330')  // Returns '13:30'
 */
export function formatTime(timeStr: string): string {
  const cleaned = timeStr.replace(':', '').padStart(4, '0');
  return `${cleaned.substring(0, 2)}:${cleaned.substring(2, 4)}`;
}

/**
 * Check if Two Time Ranges Overlap
 * 
 * Determines if two class time ranges have any overlap.
 * Used for conflict detection in timetable generation.
 * 
 * @param {string} start1 - First class start time
 * @param {string} end1 - First class end time
 * @param {string} start2 - Second class start time
 * @param {string} end2 - Second class end time
 * @returns {boolean} True if times overlap
 * 
 * @example
 * checkTimeOverlap('0900', '1100', '1000', '1200') // true (overlap)
 * checkTimeOverlap('0900', '1000', '1000', '1100') // false (adjacent, no overlap)
 * checkTimeOverlap('0900', '1000', '1100', '1200') // false (no overlap)
 */
export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Mins = parseTime(start1);
  const end1Mins = parseTime(end1);
  const start2Mins = parseTime(start2);
  const end2Mins = parseTime(end2);
  
  // Check if ranges overlap (not just touch at boundaries)
  return start1Mins < end2Mins && start2Mins < end1Mins;
}

/**
 * Timetable Constants
 */
export const TIMETABLE_CONSTANTS = {
  /** Days of the week for timetable */
  DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const,
  
  /** Start time of timetable (08:00) */
  START_TIME: '0800',
  
  /** End time of timetable (23:30) */
  END_TIME: '2330',
  
  /** Slot duration in minutes */
  SLOT_DURATION: 30,
  
  /** Total number of slots per day */
  TOTAL_SLOTS: 32, // (23:30 - 08:00) / 30 mins = 31.5 slots (32 including start)
} as const;

/**
 * Timetable Color Palettes
 */
export const MODULE_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900" },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-900" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-900" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-900" },
  { bg: "bg-cyan-100", border: "border-cyan-400", text: "text-cyan-900" },
  { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-900" },
  { bg: "bg-rose-100", border: "border-rose-400", text: "text-rose-900" },
  { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-900" },
  { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-900" },
  { bg: "bg-lime-100", border: "border-lime-400", text: "text-lime-900" },
  { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-900" },
  { bg: "bg-sky-100", border: "border-sky-400", text: "text-sky-900" },
  { bg: "bg-violet-100", border: "border-violet-400", text: "text-violet-900" },
  { bg: "bg-fuchsia-100", border: "border-fuchsia-400", text: "text-fuchsia-900" },
  { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-900" },
  { bg: "bg-red-100", border: "border-red-400", text: "text-red-900" },
];

export const PLANNER_COLORS = [
  { bg: "bg-slate-100", border: "border-slate-400", text: "text-slate-900" },
  { bg: "bg-zinc-100", border: "border-zinc-400", text: "text-zinc-900" },
  { bg: "bg-red-100", border: "border-red-400", text: "text-red-900" },
  { bg: "bg-stone-100", border: "border-stone-400", text: "text-stone-900" },
  { bg: "bg-neutral-100", border: "border-neutral-400", text: "text-neutral-900" },
  { bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-900" },
];

/**
 * Generate a consistent color based on module code or planner index.
 */
export function getIndexColor(key: string, isPlanner = false) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palette = isPlanner || key.startsWith("PLANNER") ? PLANNER_COLORS : MODULE_COLORS;
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

/**
 * Standard day abbreviations to long-form names.
 */
export const DAY_NAME_MAP: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

/**
 * Parse week ranges into numeric week arrays.
 */
export function parseWeeks(weekString?: string): number[] {
  if (!weekString || weekString === "All weeks" || weekString.trim() === "") {
    return Array.from({ length: 13 }, (_, i) => i + 1);
  }

  const weeks: number[] = [];
  const cleanedString = weekString.replace(/^(?:Teaching\s+)?Wk\s*/i, "").trim();
  const parts = cleanedString.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (start !== undefined && end !== undefined && !Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = start; i <= end; i += 1) {
          weeks.push(i);
        }
      }
    } else {
      const week = Number(part);
      if (!Number.isNaN(week)) {
        weeks.push(week);
      }
    }
  }

  return weeks.length > 0
    ? weeks.sort((a, b) => a - b)
    : Array.from({ length: 13 }, (_, i) => i + 1);
}

/**
 * Check if two week sets overlap.
 */
export function doWeeksOverlap(weeks1?: string, weeks2?: string): boolean {
  const parsedWeeks1 = parseWeeks(weeks1);
  const parsedWeeks2 = parseWeeks(weeks2);
  return parsedWeeks1.some((week) => parsedWeeks2.includes(week));
}

/**
 * Detect clashes between indexes, optionally ignoring self-clashes.
 */
export function detectClashes(
  allIndexes: IndexData[],
  ignoreSelfClashesFor?: string
): Set<string> {
  const clashingIndexes = new Set<string>();

  for (let i = 0; i < allIndexes.length; i += 1) {
    for (let j = i + 1; j < allIndexes.length; j += 1) {
      const index1 = allIndexes[i];
      const index2 = allIndexes[j];

      if (index1.moduleCode === index2.moduleCode && index1.indexNumber === index2.indexNumber) {
        continue;
      }

      if (
        ignoreSelfClashesFor &&
        index1.moduleCode === ignoreSelfClashesFor &&
        index2.moduleCode === ignoreSelfClashesFor
      ) {
        continue;
      }

      if (index1.day.toLowerCase() !== index2.day.toLowerCase()) {
        continue;
      }

      const start1 = parseTime(index1.startTime);
      const end1 = parseTime(index1.endTime);
      const start2 = parseTime(index2.startTime);
      const end2 = parseTime(index2.endTime);

      if (!(start1 < end2 && start2 < end1)) {
        continue;
      }

      if (doWeeksOverlap(index1.weeks, index2.weeks)) {
        const key1 = `${index1.moduleCode || ""}-${index1.indexNumber}`;
        const key2 = `${index2.moduleCode || ""}-${index2.indexNumber}`;
        clashingIndexes.add(key1);
        clashingIndexes.add(key2);
      }
    }
  }

  return clashingIndexes;
}

/**
 * Pre-calculate layout positions for overlapping timetable entries.
 */
export function precalculateDayLayout(items: IndexData[]) {
  const sortedItems = [...items].sort((a, b) => {
    const startA = parseTime(a.startTime);
    const startB = parseTime(b.startTime);
    if (startA !== startB) return startA - startB;

    const endA = parseTime(a.endTime);
    const endB = parseTime(b.endTime);
    const durA = endA - startA;
    const durB = endB - startB;
    if (durA !== durB) return durB - durA;
    return a.indexNumber.localeCompare(b.indexNumber);
  });

  const clusters: IndexData[][] = [];
  let currentCluster: IndexData[] = [];
  let clusterEnd = -1;

  for (const item of sortedItems) {
    const start = parseTime(item.startTime);
    const end = parseTime(item.endTime);

    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = end;
    } else if (start < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = end;
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results = new Map<string, { width: number; left: number }>();

  for (const cluster of clusters) {
    const itemCols = new Map<IndexData, number>();
    const colEnds: number[] = [];

    for (const item of cluster) {
      const start = parseTime(item.startTime);
      const end = parseTime(item.endTime);

      let placed = false;
      for (let i = 0; i < colEnds.length; i += 1) {
        if (colEnds[i] <= start) {
          itemCols.set(item, i);
          colEnds[i] = end;
          placed = true;
          break;
        }
      }

      if (!placed) {
        itemCols.set(item, colEnds.length);
        colEnds.push(end);
      }
    }

    const totalColumns = colEnds.length;

    for (const item of cluster) {
      const colIndex = itemCols.get(item) || 0;
      const key = `${item.moduleCode || ""}-${item.indexNumber}-${item.day}-${item.startTime}-${item.endTime}-${item.type}-${item.weeks || ""}-${item.venue || ""}`;
      results.set(key, {
        width: 100 / totalColumns,
        left: (colIndex * 100) / totalColumns,
      });
    }
  }

  return results;
}
