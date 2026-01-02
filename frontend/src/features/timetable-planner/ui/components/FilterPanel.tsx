"use client";

import { useState } from "react";
import type { GenerationFilters } from "../../types";
import { FilterSectionCard } from "./filter-panel/FilterSectionCard";
import { DaysOfWeekSection } from "./filter-panel/DaysOfWeekSection";
import { ClassesToConsiderSection } from "./filter-panel/ClassesToConsiderSection";
import { VenuePreferenceSection } from "./filter-panel/VenuePreferenceSection";
import { DayStartEndSection } from "./filter-panel/DayStartEndSection";
import { NumericRangeSection } from "./filter-panel/NumericRangeSection";
import { DailyLoadSection } from "./filter-panel/DailyLoadSection";
import { GenerationGoalsSection } from "./filter-panel/GenerationGoalsSection";

interface FilterPanelProps {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
}

/**
 * Controls timetable generation preferences and optimization goals.
 */
export function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (key: string) => {
    setExpandedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>
      <h2 className="font-semibold mb-2 text-sm">Generation Preferences</h2>
      <div className="space-y-1.5">
        <FilterSectionCard
          title="Days of Week"
          tooltip="Select the days you prefer to have classes. The generator will try to group classes on these days."
          isExpanded={expandedFilters.has("daysOfWeek")}
          onToggle={() => toggleFilter("daysOfWeek")}
        >
          <DaysOfWeekSection filters={filters} setFilters={setFilters} />
        </FilterSectionCard>

        <FilterSectionCard
          title="Classes to Consider"
          tooltip="Select which class types to include in the optimization process."
          isExpanded={expandedFilters.has("classes")}
          onToggle={() => toggleFilter("classes")}
        >
          <ClassesToConsiderSection filters={filters} setFilters={setFilters} />
        </FilterSectionCard>

        <FilterSectionCard
          title="Venue Type"
          tooltip="Choose whether to include online and/or in-person classes. Online classes are identified by ONLINE or E-LEARN in the venue field."
          isExpanded={expandedFilters.has("venue")}
          onToggle={() => toggleFilter("venue")}
        >
          <VenuePreferenceSection filters={filters} setFilters={setFilters} />
        </FilterSectionCard>

        <FilterSectionCard
          title="Day Start/End"
          tooltip="Define your preferred start and end times for the school day."
          isExpanded={expandedFilters.has("dayStartEnd")}
          onToggle={() => toggleFilter("dayStartEnd")}
          contentClassName="pt-1 space-y-1.5"
        >
          <DayStartEndSection filters={filters} setFilters={setFilters} />
        </FilterSectionCard>

        <FilterSectionCard
          title="Day Duration"
          tooltip="Set the minimum and maximum duration (in hours) of a school day."
          isExpanded={expandedFilters.has("dayDuration")}
          onToggle={() => toggleFilter("dayDuration")}
          showContent={expandedFilters.has("dayDuration") || filters.dayDuration.enabled}
        >
          <NumericRangeSection
            filters={filters}
            setFilters={setFilters}
            filterKey="dayDuration"
            minLimit={0}
            maxLimit={24}
          />
        </FilterSectionCard>

        <FilterSectionCard
          title="Consecutive Classes"
          tooltip="Limit how many classes you have back-to-back without a break."
          isExpanded={expandedFilters.has("consecutiveClasses")}
          onToggle={() => toggleFilter("consecutiveClasses")}
          showContent={expandedFilters.has("consecutiveClasses") || filters.consecutiveClasses.enabled}
        >
          <NumericRangeSection
            filters={filters}
            setFilters={setFilters}
            filterKey="consecutiveClasses"
            minLimit={0}
            maxLimit={12}
          />
        </FilterSectionCard>

        <FilterSectionCard
          title="Gaps Duration"
          tooltip="Control the length of breaks between classes (in hours)."
          isExpanded={expandedFilters.has("gaps")}
          onToggle={() => toggleFilter("gaps")}
          showContent={expandedFilters.has("gaps") || filters.gapsBetweenClasses.enabled}
        >
          <NumericRangeSection
            filters={filters}
            setFilters={setFilters}
            filterKey="gapsBetweenClasses"
            minLimit={0}
            maxLimit={12}
          />
        </FilterSectionCard>

        <FilterSectionCard
          title="Daily Load"
          tooltip="Skewed: Pack classes into fewer days. Balanced: Spread classes evenly."
          isExpanded={expandedFilters.has("dailyLoad")}
          onToggle={() => toggleFilter("dailyLoad")}
        >
          <DailyLoadSection filters={filters} setFilters={setFilters} />
        </FilterSectionCard>

        <FilterSectionCard
          title="Generation Goals"
          tooltip="Optimize timetable generation based on your preferences. Multiple goals can be selected."
          isExpanded={expandedFilters.has("generationGoals")}
          onToggle={() => toggleFilter("generationGoals")}
          contentClassName="pt-2 space-y-2.5"
        >
          <GenerationGoalsSection filters={filters} setFilters={setFilters} />
        </FilterSectionCard>
      </div>
    </div>
  );
}
