import type { ModuleWithIndexes } from "../../../types";

type ModuleIndex = NonNullable<ModuleWithIndexes["indexes"]>[number];

/**
 * Heuristic check for whether a string looks like a module code.
 */
export const isLikelyModuleCode = (value: string): boolean => {
  return /^[A-Z]{2,4}\d{4}[A-Z]?$/i.test(value.trim());
};

/**
 * Groups raw index rows by index number for preview rendering.
 */
export const groupIndexesByNumber = (
  indexes: ModuleIndex[]
): Record<string, ModuleIndex[]> => {
  return indexes.reduce<Record<string, ModuleIndex[]>>((acc, index) => {
    if (!acc[index.indexNumber]) {
      acc[index.indexNumber] = [];
    }
    acc[index.indexNumber].push(index);
    return acc;
  }, {});
};

/**
 * Summarizes class durations by lesson type.
 */
export const summarizeClassDurations = (
  indexes: ModuleIndex[]
): Array<{ type: string; minutes: number }> => {
  const durations: Record<string, number> = {};

  indexes.forEach((index) => {
    const startHour = Math.floor(parseInt(index.startTime, 10) / 100);
    const startMin = parseInt(index.startTime, 10) % 100;
    const endHour = Math.floor(parseInt(index.endTime, 10) / 100);
    const endMin = parseInt(index.endTime, 10) % 100;

    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    const duration = endTotal >= startTotal ? endTotal - startTotal : 24 * 60 - startTotal + endTotal;

    if (!durations[index.type]) {
      durations[index.type] = duration;
    }
  });

  return Object.entries(durations).map(([type, minutes]) => ({ type, minutes }));
};

/**
 * Formats a duration in minutes as a short string.
 */
export const formatDurationMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);

  return parts.join(" ") || "0 min";
};

/**
 * Formats a compact time range from HHMM strings.
 */
export const formatTimeRange = (start: string, end: string): string => {
  const startHours = start.substring(0, 2);
  const startMinutes = start.substring(2);
  const endHours = end.substring(0, 2);
  const endMinutes = end.substring(2);

  return `${startHours}:${startMinutes}-${endHours}:${endMinutes}`;
};
