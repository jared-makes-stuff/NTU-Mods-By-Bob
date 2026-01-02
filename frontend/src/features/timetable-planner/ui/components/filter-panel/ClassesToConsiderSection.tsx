"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import type { GenerationFilters } from "../../../types";

const classOptions = [
  { key: "tutorial", label: "TUT" },
  { key: "lab", label: "LAB" },
  { key: "seminar", label: "SEM" },
  { key: "lecture", label: "LEC" },
  { key: "project", label: "PRJ" },
  { key: "design", label: "DES" },
] as const;

type ClassKey = (typeof classOptions)[number]["key"];

interface ClassesToConsiderSectionProps {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
}

/**
 * Controls which class types are included in generation scoring.
 */
export function ClassesToConsiderSection({ filters, setFilters }: ClassesToConsiderSectionProps) {
  const toggleClass = (key: ClassKey, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      classesToConsider: { ...prev.classesToConsider, [key]: checked },
    }));
  };

  return (
    <div className="space-y-0.5">
      {classOptions.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <Checkbox
            id={`consider-${key}`}
            checked={filters.classesToConsider?.[key] ?? true}
            onCheckedChange={(checked) => toggleClass(key, checked === true)}
            className="size-3 border-primary/50"
          />
          <label htmlFor={`consider-${key}`} className="text-xs cursor-pointer">
            {label}
          </label>
        </div>
      ))}
    </div>
  );
}
