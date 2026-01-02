import { DAY_NAME_MAP, precalculateDayLayout } from "@/shared/lib/timetable-utils";
import type { IndexData } from "@/shared/types/timetable";

export type LayoutMap = Map<string, { width: number; left: number }>;

/**
 * Builds a stable key for timetable entries to dedupe layout items.
 */
export const buildItemKey = (item: IndexData): string => {
  return `${item.moduleCode || ""}-${item.indexNumber}-${item.day}-${item.startTime}-${item.endTime}-${item.type}-${item.weeks || ""}-${item.venue || ""}`;
};

/**
 * Normalizes a raw day string to the timetable display format.
 */
export const normalizeDayName = (day: string): string => {
  const upper = day.toUpperCase();
  return DAY_NAME_MAP[upper] || day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
};

/**
 * Dedupe index items by their unique key.
 */
export const dedupeIndexes = (items: IndexData[]): IndexData[] => {
  const map = new Map<string, IndexData>();
  items.forEach((item) => {
    const key = buildItemKey(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
};

/**
 * Precomputes layout offsets for overlapping items.
 */
export const buildLayoutMap = (items: IndexData[]): LayoutMap => {
  const map: LayoutMap = new Map();
  const itemsByDay = new Map<string, IndexData[]>();

  items.forEach((item) => {
    const normalizedDay = normalizeDayName(item.day);
    if (!itemsByDay.has(normalizedDay)) {
      itemsByDay.set(normalizedDay, []);
    }
    itemsByDay.get(normalizedDay)?.push(item);
  });

  for (const [, dayItems] of itemsByDay) {
    const dayLayout = precalculateDayLayout(dayItems);
    dayLayout.forEach((layout, key) => map.set(key, layout));
  }

  return map;
};

/**
 * Computes opacity class based on preview state and hover.
 */
export const getOpacityClass = (options: {
  hasPreviewItems: boolean;
  effectiveHoveredIndex: string | null;
  isSameModule: boolean;
  isPreview: boolean | undefined;
  itemIndex: string;
}): string => {
  const { hasPreviewItems, effectiveHoveredIndex, isSameModule, isPreview, itemIndex } = options;

  if (hasPreviewItems && effectiveHoveredIndex) {
    if (itemIndex === effectiveHoveredIndex) {
      return "opacity-100";
    }
    if (isSameModule) {
      return "opacity-15";
    }
    return "opacity-100";
  }

  if (hasPreviewItems && !effectiveHoveredIndex) {
    if (isSameModule) {
      return isPreview ? "opacity-60" : "opacity-40";
    }
    return "opacity-100";
  }

  return "opacity-100";
};
