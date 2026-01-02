"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { TimetableDisplay } from "@/shared/ui/timetable/TimetableDisplay";
import { getIndexColor } from "@/shared/lib/timetable-utils";
import type { ModuleWithIndexes } from "../../../types";
import type { PreviewIndex } from "./types";
import {
  formatDurationMinutes,
  formatTimeRange,
  groupIndexesByNumber,
  summarizeClassDurations,
} from "./moduleDetailUtils";

interface ModuleIndexesCardProps {
  module: ModuleWithIndexes;
  previewIndexes: PreviewIndex[];
  setPreviewIndexes: React.Dispatch<React.SetStateAction<PreviewIndex[]>>;
}

/**
 * Shows available indexes and a timetable preview.
 */
export function ModuleIndexesCard({
  module,
  previewIndexes,
  setPreviewIndexes,
}: ModuleIndexesCardProps) {
  if (!module.indexes || module.indexes.length === 0) {
    return null;
  }

  const classDurations = summarizeClassDurations(module.indexes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Indexes &amp; Timetable Preview</CardTitle>
        <CardDescription>
          {classDurations.length === 0 ? (
            "No class information available"
          ) : (
            <>
              Classes:{" "}
              {classDurations.map((info, idx) => (
                <span key={info.type}>
                  {idx > 0 && " | "}
                  <strong>{info.type}</strong> ({formatDurationMinutes(info.minutes)}/week)
                </span>
              ))}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 min-h-[28px]">
              <h3 className="font-semibold text-sm">Timetable Preview</h3>
              {previewIndexes.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewIndexes([])}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              ) : (
                <div className="h-7" />
              )}
            </div>
            <div
              id="timetable-container"
              className="border rounded-lg bg-muted/10 overflow-auto"
              style={{ height: "800px" }}
            >
              <TimetableDisplay
                indexes={previewIndexes}
                moduleCode={module.code}
                colorBy="index"
              />
            </div>
          </div>

          <div className="w-[280px] flex-shrink-0 flex flex-col" style={{ height: "800px" }}>
            <div className="mb-4 flex-shrink-0">
              <h3 className="font-semibold text-base mb-1">Select Indexes</h3>
              <p className="text-xs text-muted-foreground">Click to preview on timetable</p>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-h-0">
              <div className="space-y-2">
                {Object.entries(groupIndexesByNumber(module.indexes)).map(([indexNumber, classes]) => {
                  const isSelected = previewIndexes.some((index) => index.indexNumber === indexNumber);
                  const colors = getIndexColor(indexNumber);

                  return (
                    <div
                      key={indexNumber}
                      className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.border} shadow-sm`
                          : "border-border hover:bg-muted/50 hover:border-muted-foreground/30"
                      }`}
                      onClick={() => {
                        setPreviewIndexes((prev) => {
                          const alreadySelected = prev.some((index) => index.indexNumber === indexNumber);
                          if (alreadySelected) {
                            return prev.filter((index) => index.indexNumber !== indexNumber);
                          }
                          return [...prev, ...classes];
                        });
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 pointer-events-none flex-shrink-0"
                          readOnly
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-semibold text-xs mb-1"
                            style={isSelected ? { color: "#000" } : {}}
                          >
                            {indexNumber}
                          </div>
                          <div
                            className="text-[10px] space-y-1"
                            style={isSelected ? { color: "#000" } : {}}
                          >
                            {classes.map((cls, idx) => (
                              <div key={`${cls.indexNumber}-${idx}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div
                                      className="font-medium"
                                      style={isSelected ? { color: "#000" } : {}}
                                    >
                                      {cls.type}
                                    </div>
                                    <div style={isSelected ? { color: "#000" } : {}}>
                                      {cls.day} {formatTimeRange(cls.startTime, cls.endTime)}
                                    </div>
                                  </div>
                                  {cls.venue && (
                                    <div
                                      className="text-[9px] text-right flex-shrink-0 max-w-[80px]"
                                      title={cls.venue}
                                      style={isSelected ? { color: "#000" } : {}}
                                    >
                                      Venue: {cls.venue.length > 12 ? `${cls.venue.substring(0, 12)}...` : cls.venue}
                                    </div>
                                  )}
                                </div>
                                {idx < classes.length - 1 && (
                                  <div
                                    className="my-1 border-t"
                                    style={
                                      isSelected
                                        ? { borderColor: "rgba(0,0,0,0.2)" }
                                        : { borderColor: "hsl(var(--muted-foreground) / 0.2)" }
                                    }
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
