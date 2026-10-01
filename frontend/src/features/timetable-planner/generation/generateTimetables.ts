import { parseTime } from "@/shared/lib/timetable-utils";
import { formatWeeks } from "../utils";
import type {
  ClassItem,
  GenerationFilters,
  GenerationResult,
  ModuleWithIndexes,
  TimetableCombination,
} from "./types";
import { generateCombinations, type TimetableCombinationInternal } from "./combinationBuilder";

const MAX_RESULTS = 100;

const normalizeTimeValue = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^\d{4}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return trimmed;
  return `${match[1]!.padStart(2, "0")}${match[2]}`;
};

const normalizeFilters = (filters: GenerationFilters): GenerationFilters => ({
  ...filters,
  dayStartEnd: {
    ...filters.dayStartEnd,
    startAfter: normalizeTimeValue(filters.dayStartEnd.startAfter),
    endBefore: normalizeTimeValue(filters.dayStartEnd.endBefore),
  },
});

const shouldConsiderClassType = (type: string, filters: GenerationFilters): boolean => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("tut")) return filters.classesToConsider.tutorial;
  if (typeLower.includes("lab")) return filters.classesToConsider.lab;
  if (typeLower.includes("sem")) return filters.classesToConsider.seminar;
  if (typeLower.includes("lec")) return filters.classesToConsider.lecture;
  if (typeLower.includes("prj")) return filters.classesToConsider.project;
  if (typeLower.includes("des")) return filters.classesToConsider.design;
  return true;
};

const filterClassesByType = (index: { classes: ClassItem[] }, filters: GenerationFilters): ClassItem[] =>
  index.classes.filter((classItem) => shouldConsiderClassType(classItem.type, filters));

const isOnlineVenue = (venue: string): boolean => {
  const onlineKeywords = ["online", "e-learn", "elearn", "virtual", "zoom", "teams"];
  return onlineKeywords.some((keyword) => venue.toLowerCase().includes(keyword));
};

const passesVenuePreference = (classes: ClassItem[], filters: GenerationFilters): boolean => {
  const venueFilterActive =
    !filters.venuePreference.includeOnline || !filters.venuePreference.includeInPerson;

  if (!venueFilterActive) {
    return true;
  }

  const hasOnlineClass = classes.some((c) => isOnlineVenue(c.venue));
  const hasInPersonClass = classes.some((c) => !isOnlineVenue(c.venue));

  if (filters.venuePreference.includeOnline && !filters.venuePreference.includeInPerson && hasInPersonClass) {
    return false;
  }

  if (!filters.venuePreference.includeOnline && filters.venuePreference.includeInPerson && hasOnlineClass) {
    return false;
  }

  return true;
};

const passesDayTimeConstraints = (classes: ClassItem[], filters: GenerationFilters): boolean => {
  if (!filters.dayStartEnd.startEnabled && !filters.dayStartEnd.endEnabled) {
    return true;
  }

  const startAfter = parseTime(filters.dayStartEnd.startAfter);
  const endBefore = parseTime(filters.dayStartEnd.endBefore);

  return !classes.some((classItem) => {
    const classStart = parseTime(classItem.startTime);
    const classEnd = parseTime(classItem.endTime);

    if (filters.dayStartEnd.startEnabled && classStart < startAfter) {
      return true;
    }
    if (filters.dayStartEnd.endEnabled && classEnd > endBefore) {
      return true;
    }
    return false;
  });
};

const passesDayOfWeekConstraints = (classes: ClassItem[], filters: GenerationFilters): boolean => {
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
    MON: "monday",
    TUE: "tuesday",
    WED: "wednesday",
    THU: "thursday",
    FRI: "friday",
    SAT: "saturday",
    SUN: "sunday",
  };

  return !classes.some((classItem) => {
    const normalizedDay = classItem.day.toUpperCase().substring(0, 3);
    const dayKey = dayMap[normalizedDay];
    const isDayEnabled = dayKey ? filters.daysOfWeek[dayKey] : false;
    return !isDayEnabled;
  });
};

const filterModuleIndexes = (modules: ModuleWithIndexes[], filters: GenerationFilters): ModuleWithIndexes[] =>
  modules
    .map((module) => {
      const filteredIndexes = module.indexes.filter((index) => {
        const classesToCheck = filterClassesByType(index, filters);

        if (classesToCheck.length === 0) return false;
        if (!passesVenuePreference(classesToCheck, filters)) return false;
        if (!passesDayTimeConstraints(classesToCheck, filters)) return false;
        if (!passesDayOfWeekConstraints(classesToCheck, filters)) return false;
        return true;
      });

      return { ...module, indexes: filteredIndexes };
    })
    .filter((module) => module.indexes.length > 0);

const calculateDurationHours = (startTime: string, endTime: string): number => {
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  return (endMinutes - startMinutes) / 60;
};

const scoreCombination = (combination: TimetableCombination, filters: GenerationFilters): number => {
  let score = 100;

  const classesForScoring = combination.classes.filter((c) =>
    shouldConsiderClassType(c.type, filters)
  );

  const classesByDay: Record<string, typeof classesForScoring> = {};
  classesForScoring.forEach((c) => {
    if (!classesByDay[c.day]) {
      classesByDay[c.day] = [];
    }
    classesByDay[c.day]!.push(c);
  });

  if (filters.dayDuration.enabled) {
    Object.values(classesByDay).forEach((dayClasses) => {
      if (dayClasses.length === 0) return;

      const sorted = [...dayClasses].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const firstClass = sorted[0];
      const lastClass = sorted[sorted.length - 1];
      if (!firstClass || !lastClass) return;

      const duration = calculateDurationHours(firstClass.startTime, lastClass.endTime);
      if (duration < filters.dayDuration.min || duration > filters.dayDuration.max) {
        score -= 20;
      }
    });
  }

  if (filters.gapsBetweenClasses.enabled) {
    Object.values(classesByDay).forEach((dayClasses) => {
      const sorted = [...dayClasses].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < sorted.length - 1; i += 1) {
        const currentClass = sorted[i];
        const nextClass = sorted[i + 1];
        if (!currentClass || !nextClass) continue;

        const gap = calculateDurationHours(currentClass.endTime, nextClass.startTime);
        if (gap < filters.gapsBetweenClasses.min || gap > filters.gapsBetweenClasses.max) {
          score -= 10;
        }
      }
    });
  }

  if (filters.dailyLoad.enabled) {
    const daysUsed = Object.keys(classesByDay).length;
    if (filters.dailyLoad.preference === "balanced") {
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
      const classCountsPerDay = Object.values(classesByDay).map((d) => d.length);
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
        const dayOrder = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
        const usedDayIndices = daysWithClasses
          .map((day) => dayOrder.indexOf(day.toUpperCase().substring(0, 3)))
          .filter((idx) => idx !== -1)
          .sort((a, b) => a - b);

        const isConsecutive = usedDayIndices.every((value, index, arr) => {
          if (index === 0) return true;
          return value - arr[index - 1]! === 1;
        });

        score += isConsecutive ? 50 : -10000;
      }
    }
  }

  return score;
};

const timeToMinutes = (time: string): number => parseTime(time);

const enrichCombination = (combination: TimetableCombination): TimetableCombination => {
  const days = new Set(combination.classes.map((c) => c.day));

  let totalMinutes = 0;
  let minStart = 2400;
  let maxEnd = 0;

  const byDay: Record<string, typeof combination.classes> = {};

  combination.classes.forEach((c) => {
    const start = parseInt(c.startTime, 10);
    const end = parseInt(c.endTime, 10);
    const startMin = timeToMinutes(c.startTime);
    const endMin = timeToMinutes(c.endTime);

    totalMinutes += endMin - startMin;
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;

    if (!byDay[c.day]) byDay[c.day] = [];
    byDay[c.day]!.push(c);
  });

  let totalGapMinutes = 0;
  let gapCount = 0;

  Object.values(byDay).forEach((dayClasses) => {
    dayClasses.sort((a, b) => parseInt(a.startTime, 10) - parseInt(b.startTime, 10));
    for (let i = 0; i < dayClasses.length - 1; i += 1) {
      const currentEnd = timeToMinutes(dayClasses[i]!.endTime);
      const nextStart = timeToMinutes(dayClasses[i + 1]!.startTime);
      if (nextStart > currentEnd) {
        totalGapMinutes += nextStart - currentEnd;
        gapCount += 1;
      }
    }
  });

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    ...combination,
    id,
    stats: {
      totalDays: days.size,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      averageGapDuration: gapCount > 0 ? Math.round(totalGapMinutes / gapCount) : 0,
      earliestStart: minStart === 2400 ? "0000" : minStart.toString().padStart(4, "0"),
      latestEnd: maxEnd.toString().padStart(4, "0"),
    },
  };
};

const toPublicCombination = (combo: TimetableCombinationInternal): TimetableCombination => ({
  modules: combo.modules,
  classes: combo.classes.map((cls) => ({
    moduleCode: cls.moduleCode,
    indexNumber: cls.indexNumber,
    type: cls.type,
    day: cls.day,
    startTime: cls.startTime,
    endTime: cls.endTime,
    venue: cls.venue,
    weeks: formatWeeks(cls.weeks),
  })),
  score: 0,
  stats: {
    totalDays: 0,
    totalHours: 0,
    averageGapDuration: 0,
    earliestStart: "0000",
    latestEnd: "0000",
  },
  id: "",
});

const buildResponse = (combinations: TimetableCombination[]): GenerationResult => {
  const topCombinations = combinations.slice(0, MAX_RESULTS);
  return {
    combinations: topCombinations,
    generatedAt: new Date().toISOString(),
    totalCombinations: combinations.length,
    returnedCount: topCombinations.length,
    hasMore: combinations.length > MAX_RESULTS,
  };
};

export function generateTimetableCombinations(params: {
  modules: ModuleWithIndexes[];
  filters: GenerationFilters;
}): GenerationResult {
  const { modules, filters } = params;

  if (!modules.length) {
    return buildResponse([]);
  }

  const normalizedFilters = normalizeFilters(filters);
  const filteredModules = filterModuleIndexes(modules, normalizedFilters);
  if (filteredModules.length === 0 || filteredModules.some((module) => module.indexes.length === 0)) {
    return buildResponse([]);
  }

  const combinations = generateCombinations(filteredModules);
  if (combinations.length === 0) {
    return buildResponse([]);
  }

  const scoredCombinations = combinations
    .map((combo) => toPublicCombination(combo))
    .map((combo) => {
      const enriched = enrichCombination(combo);
      return {
        ...enriched,
        score: scoreCombination(enriched, normalizedFilters),
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return buildResponse(scoredCombinations);
}
