"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import type { GenerationFilters } from "../../../types";

interface GenerationGoalsSectionProps {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
}

const goalOptions = [
  {
    key: "balanceWorkload",
    label: "Balance workload across days",
    tooltip: "Distributes classes evenly across days to avoid having too many classes on one day.",
  },
  {
    key: "minimizeDays",
    label: "Squeeze into least amount of days",
    tooltip: "Prioritizes schedules that use fewer days, giving you more free days.",
  },
  {
    key: "consecutiveDays",
    label: "Only consecutive days",
    tooltip: "Ensures all class days are consecutive (e.g., Mon-Tue-Wed) with no gaps.",
  },
] as const;

type GoalKey = (typeof goalOptions)[number]["key"];

/**
 * Captures high-level optimization goals for timetable generation.
 */
export function GenerationGoalsSection({ filters, setFilters }: GenerationGoalsSectionProps) {
  const toggleGoal = (key: GoalKey, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      generationGoals: {
        ...prev.generationGoals,
        [key]: checked,
      },
    }));
  };

  return (
    <div className="space-y-2.5">
      {goalOptions.map((goal) => (
        <div key={goal.key} className="flex items-center gap-2">
          <Checkbox
            id={`goal-${goal.key}`}
            checked={filters.generationGoals[goal.key]}
            onCheckedChange={(checked) => toggleGoal(goal.key, checked === true)}
            className="size-3 border-primary/50"
          />
          <label htmlFor={`goal-${goal.key}`} className="text-xs cursor-pointer flex items-center gap-1.5">
            {goal.label}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">{goal.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
        </div>
      ))}
    </div>
  );
}
