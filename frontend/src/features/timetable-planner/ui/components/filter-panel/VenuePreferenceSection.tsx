"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import type { GenerationFilters } from "../../../types";

interface VenuePreferenceSectionProps {
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;
}

/**
 * Controls whether online or in-person venues are considered.
 */
export function VenuePreferenceSection({ filters, setFilters }: VenuePreferenceSectionProps) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <Checkbox
          id="venue-online"
          checked={filters.venuePreference?.includeOnline ?? true}
          onCheckedChange={(checked) =>
            setFilters((prev) => ({
              ...prev,
              venuePreference: { ...prev.venuePreference, includeOnline: checked === true },
            }))
          }
          className="size-3 border-primary/50"
        />
        <label htmlFor="venue-online" className="text-xs cursor-pointer">
          Online Classes
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="venue-inperson"
          checked={filters.venuePreference?.includeInPerson ?? true}
          onCheckedChange={(checked) =>
            setFilters((prev) => ({
              ...prev,
              venuePreference: { ...prev.venuePreference, includeInPerson: checked === true },
            }))
          }
          className="size-3 border-primary/50"
        />
        <label htmlFor="venue-inperson" className="text-xs cursor-pointer">
          In-Person Classes
        </label>
      </div>
    </div>
  );
}
