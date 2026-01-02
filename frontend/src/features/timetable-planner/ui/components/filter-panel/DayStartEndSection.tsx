"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import type { GenerationFilters } from "../../../types";

interface DayStartEndSectionProps {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
}

/**
 * Configures preferred daily start/end times for generation.
 */
export function DayStartEndSection({ filters, setFilters }: DayStartEndSectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground text-xs">Start after</span>
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={filters.dayStartEnd.startAfter}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                dayStartEnd: { ...prev.dayStartEnd, startAfter: event.target.value },
              }))
            }
            disabled={!filters.dayStartEnd.startEnabled}
            className="h-6 w-[80px] text-xs px-1"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">On</span>
            <Checkbox
              checked={filters.dayStartEnd.startEnabled}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  dayStartEnd: { ...prev.dayStartEnd, startEnabled: checked === true },
                }))
              }
              className="size-3.5 border-primary/50"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground text-xs">End before</span>
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={filters.dayStartEnd.endBefore}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                dayStartEnd: { ...prev.dayStartEnd, endBefore: event.target.value },
              }))
            }
            disabled={!filters.dayStartEnd.endEnabled}
            className="h-6 w-[80px] text-xs px-1"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">On</span>
            <Checkbox
              checked={filters.dayStartEnd.endEnabled}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  dayStartEnd: { ...prev.dayStartEnd, endEnabled: checked === true },
                }))
              }
              className="size-3.5 border-primary/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
