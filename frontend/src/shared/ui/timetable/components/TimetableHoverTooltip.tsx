"use client";

import React from "react";
import type { IndexData } from "@/shared/types/timetable";

interface TimetableHoverTooltipProps {
  tooltipData: {
    x: number;
    y: number;
    classes: IndexData[];
  } | null;
}

export function TimetableHoverTooltip({ tooltipData }: TimetableHoverTooltipProps) {
  if (!tooltipData) return null;

  const currentIndex = tooltipData.classes[0]?.indexNumber;

  return (
    <div
      className="fixed bg-card text-card-foreground border-2 rounded-lg shadow-2xl p-4 z-[100] min-w-[280px] max-w-md"
      style={{
        left: `${tooltipData.x}px`,
        top: `${tooltipData.y}px`,
        pointerEvents: "none",
      }}
    >
      {/* Current Index */}
      <div className="text-base font-bold mb-2 pb-2 border-b">
        Index {currentIndex}
      </div>

      {/* Current index details */}
      <div className="space-y-3 text-sm">
        {[...tooltipData.classes]
          .sort((a, b) => a.type.localeCompare(b.type))
          .map((cls, idx) => (
            <div key={idx} className="border-t pt-3 first:border-0 first:pt-0">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-base">{cls.type}</span>
                <span className="text-muted-foreground font-medium">
                  {cls.day.substring(0, 3)}
                </span>
              </div>
              <div className="text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Time</span>
                  <span>
                    {cls.startTime.substring(0, 2)}:{cls.startTime.substring(2)} -
                    {" "}
                    {cls.endTime.substring(0, 2)}:{cls.endTime.substring(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Venue</span>
                  <span>{cls.venue || "TBA"}</span>
                </div>
                {cls.weeks && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Weeks</span>
                    <span>{cls.weeks}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
