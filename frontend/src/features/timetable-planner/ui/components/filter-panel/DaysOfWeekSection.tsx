"use client";

import { Badge } from "@/shared/ui/badge";
import type { GenerationFilters } from "../../../types";

const dayOptions = [
  { key: "monday", label: "MON" },
  { key: "tuesday", label: "TUE" },
  { key: "wednesday", label: "WED" },
  { key: "thursday", label: "THU" },
  { key: "friday", label: "FRI" },
  { key: "saturday", label: "SAT" },
  { key: "sunday", label: "SUN" },
] as const;

type DayKey = (typeof dayOptions)[number]["key"];

interface DaysOfWeekSectionProps {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
}

/**
 * Toggles preferred class days.
 */
export function DaysOfWeekSection({ filters, setFilters }: DaysOfWeekSectionProps) {
  const toggleDay = (key: DayKey) => {
    setFilters((prev) => ({
      ...prev,
      daysOfWeek: {
        ...prev.daysOfWeek,
        [key]: !prev.daysOfWeek[key],
      },
    }));
  };

  return (
    <div className="flex gap-1">
      {dayOptions.map(({ key, label }) => (
        <Badge
          key={key}
          variant={filters.daysOfWeek[key] ? "default" : "outline"}
          className={`cursor-pointer transition-all text-[9px] px-1.5 py-0.5 whitespace-nowrap ${
            filters.daysOfWeek[key]
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-accent"
          }`}
          onClick={() => toggleDay(key)}
        >
          {label}
        </Badge>
      ))}
    </div>
  );
}
