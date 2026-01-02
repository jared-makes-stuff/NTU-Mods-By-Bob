"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import type { GenerationFilters } from "../../../types";

const numericFilterLabels = {
  dayDuration: { minLabel: "Min", maxLabel: "Max" },
  consecutiveClasses: { minLabel: "Min", maxLabel: "Max" },
  gapsBetweenClasses: { minLabel: "Min", maxLabel: "Max" },
} as const;

type NumericFilterKey = keyof typeof numericFilterLabels;

type NumericRangeSectionProps = {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
  filterKey: NumericFilterKey;
  minLimit: number;
  maxLimit: number;
};

/**
 * Numeric min/max range section for duration-based filters.
 */
export function NumericRangeSection({
  filters,
  setFilters,
  filterKey,
  minLimit,
  maxLimit,
}: NumericRangeSectionProps) {
  const current = filters[filterKey];

  const updateValue = (field: "min" | "max", value: string) => {
    const parsed = parseInt(value, 10);
    const numericValue = Number.isFinite(parsed) ? parsed : 0;

    setFilters((prev) => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [field]: numericValue,
      },
    }));
  };

  const toggleEnabled = (enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        enabled,
      },
    }));
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <span className="text-xs text-muted-foreground block leading-tight">
          {numericFilterLabels[filterKey].minLabel}
        </span>
        <Input
          type="number"
          min={minLimit}
          max={maxLimit}
          value={current.min}
          onChange={(event) => updateValue("min", event.target.value)}
          className="h-6 text-xs px-1"
          disabled={!current.enabled}
        />
      </div>
      <div className="flex-1">
        <span className="text-xs text-muted-foreground block leading-tight">
          {numericFilterLabels[filterKey].maxLabel}
        </span>
        <Input
          type="number"
          min={minLimit}
          max={maxLimit}
          value={current.max}
          onChange={(event) => updateValue("max", event.target.value)}
          className="h-6 text-xs px-1"
          disabled={!current.enabled}
        />
      </div>
      <div className="flex flex-col items-center gap-0.5 pb-0.5">
        <span className="text-xs text-muted-foreground leading-tight">On</span>
        <Checkbox
          id={`${filterKey}-check`}
          checked={current.enabled}
          onCheckedChange={(checked) => toggleEnabled(checked === true)}
          className="size-3.5 border-primary/50"
        />
      </div>
    </div>
  );
}
