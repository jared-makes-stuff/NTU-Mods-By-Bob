"use client";

import React from "react";
import type { IndexData } from "@/shared/types/timetable";
import { TimetablePreviewGridItem } from "./preview-grid/TimetablePreviewGridItem";
import { buildItemKey, buildLayoutMap, dedupeIndexes } from "./preview-grid/previewGridUtils";

interface TimetablePreviewGridContentProps {
  timetableData: {
    [day: string]: {
      [slot: number]: Array<IndexData & { isStart: boolean; isPreview?: boolean }>;
    };
  };
  days: string[];
  timeLabels: Array<{ time: string; label: string; rowSpan: number }>;
  moduleCode: string;
  colorBy: "module" | "index";
  filteredIndexes: IndexData[];
  filteredPreviewIndexes: IndexData[];
  effectiveHoveredIndex: string | null;
  onIndexClick?: (indexNumber: string, moduleCode?: string, isPreview?: boolean) => void;
  onDeleteCustomEvent?: (id: string) => void;
  setHoveredIndex: React.Dispatch<React.SetStateAction<string | null>>;
  setTooltipData: React.Dispatch<React.SetStateAction<{ x: number; y: number; classes: IndexData[] } | null>>;
  clashingIndexes: Set<string>;
  previewIndexes: IndexData[];
}

/**
 * Timetable grid content for preview mode.
 */
export function TimetablePreviewGridContent({
  timetableData,
  days,
  timeLabels,
  moduleCode,
  colorBy,
  filteredIndexes,
  filteredPreviewIndexes,
  effectiveHoveredIndex,
  onIndexClick,
  onDeleteCustomEvent,
  setHoveredIndex,
  setTooltipData,
  clashingIndexes,
  previewIndexes,
}: TimetablePreviewGridContentProps) {
  const allIndexes = React.useMemo(
    () => [...filteredIndexes, ...filteredPreviewIndexes],
    [filteredIndexes, filteredPreviewIndexes]
  );

  const layoutMap = React.useMemo(() => {
    const dedupedItems = dedupeIndexes(allIndexes);
    return buildLayoutMap(dedupedItems);
  }, [allIndexes]);

  const renderItems = (
    items: Array<IndexData & { isPreview?: boolean }>,
    variant: "merged" | "standard"
  ) => {
    return items.map((item) => {
      const key = buildItemKey(item);
      const layout = layoutMap.get(key) || { width: 100, left: 0 };

      return (
        <TimetablePreviewGridItem
          key={key}
          item={item}
          moduleCode={moduleCode}
          colorBy={colorBy}
          layout={layout}
          effectiveHoveredIndex={effectiveHoveredIndex}
          previewIndexes={previewIndexes}
          clashingIndexes={clashingIndexes}
          allIndexes={allIndexes}
          onIndexClick={onIndexClick}
          onDeleteCustomEvent={onDeleteCustomEvent}
          setHoveredIndex={setHoveredIndex}
          setTooltipData={setTooltipData}
          variant={variant}
        />
      );
    });
  };

  return (
    <div
      className="grid grid-cols-[70px_repeat(6,1fr)] gap-px bg-border flex-grow overflow-hidden"
      style={{ gridTemplateRows: "repeat(32, minmax(0, 1fr))" }}
    >
      {timeLabels.map((timeItem, slotIndex) => {
        const rowStart = slotIndex + 1;

        if (timeItem.rowSpan === 0) {
          return (
            <React.Fragment key={timeItem.time}>
              {days.map((day, dayIndex) => {
                const cellDataArray = timetableData[day]?.[slotIndex] || [];
                const startingItems = cellDataArray.filter((item) => item.isStart);

                startingItems.sort((a, b) => {
                  if (a.isPreview === b.isPreview) return 0;
                  return a.isPreview ? 1 : -1;
                });

                if (startingItems.length === 0) {
                  return (
                    <div
                      key={`${day}-${slotIndex}`}
                      className="bg-background h-full"
                      style={{ gridColumn: dayIndex + 2, gridRow: rowStart }}
                    />
                  );
                }

                return (
                  <div
                    key={`${day}-${slotIndex}`}
                    className="relative h-full bg-background"
                    style={{ gridColumn: dayIndex + 2, gridRow: rowStart }}
                  >
                    {renderItems(startingItems, "merged")}
                  </div>
                );
              })}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={timeItem.time}>
            <div
              className="bg-background p-1 text-xs text-muted-foreground flex items-start justify-end pr-2 pt-1 min-h-[30px]"
              style={{
                gridColumn: 1,
                gridRow: timeItem.rowSpan > 1 ? `${rowStart} / span ${timeItem.rowSpan}` : rowStart,
              }}
            >
              {timeItem.label}
            </div>

            {days.map((day, dayIndex) => {
              const cellDataArray = timetableData[day]?.[slotIndex] || [];
              const startingItems = cellDataArray.filter((item) => item.isStart);

              if (startingItems.length === 0) {
                return (
                  <div
                    key={`${day}-${slotIndex}`}
                    className="bg-background h-full pointer-events-none"
                    style={{
                      gridColumn: dayIndex + 2,
                      gridRow: rowStart,
                    }}
                  />
                );
              }

              return (
                <div
                  key={`${day}-${slotIndex}`}
                  className="relative h-full bg-background"
                  style={{ gridColumn: dayIndex + 2, gridRow: rowStart }}
                >
                  {renderItems(startingItems, "standard")}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}
