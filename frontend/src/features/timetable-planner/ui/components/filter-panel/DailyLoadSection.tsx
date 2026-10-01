"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { GenerationFilters } from "../../../types";

interface DailyLoadSectionProps {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
}

/**
 * Controls whether generation prefers skewed or balanced day layouts.
 */
export function DailyLoadSection({ filters, setFilters }: DailyLoadSectionProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground text-xs">Preference</span>
        <div className="flex items-center gap-2">
          <Select
            value={filters.dailyLoad.preference}
            onValueChange={(value: "skewed" | "balanced") =>
              setFilters((prev) => ({
                ...prev,
                dailyLoad: { ...prev.dailyLoad, preference: value },
              }))
            }
          >
            <SelectTrigger className="h-6 w-[100px] text-xs px-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skewed">Skewed</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">On</span>
            <Checkbox
              checked={filters.dailyLoad.enabled}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({
                  ...prev,
                  dailyLoad: { ...prev.dailyLoad, enabled: checked === true },
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
