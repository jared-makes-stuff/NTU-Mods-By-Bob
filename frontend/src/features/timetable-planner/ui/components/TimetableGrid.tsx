"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { TimetablePreview } from "@/shared/ui/timetable/TimetablePreview";
import type { IndexData } from "@/shared/types/timetable";

interface TimetableGridProps {
  activeIndexes: IndexData[];
  previewingModuleCode: string | null;
  activePreviewIndexes: IndexData[];
  hoveredPreviewIndex: string | null;
  handleIndexClick: (indexNumber: string, moduleCode?: string, isPreview?: boolean) => void;
  selectedWeek: number;
  onRemoveCustomEvent: (id: string) => void;
  onClearTimetable: () => void;
}

export function TimetableGrid({
  activeIndexes,
  previewingModuleCode,
  activePreviewIndexes,
  hoveredPreviewIndex,
  handleIndexClick,
  selectedWeek,
  onRemoveCustomEvent,
  onClearTimetable
}: TimetableGridProps) {
  return (
    <div className="flex-1 overflow-hidden bg-background">
      <Card className="h-full flex flex-col overflow-hidden py-0 gap-0">
        <CardHeader className="flex-shrink-0 flex flex-row items-start justify-between space-y-0 pt-4 pb-0">
          <div className="space-y-1">
            <CardTitle>Timetable Plan</CardTitle>
            <CardDescription>Add modules and plan your semesters timetable out</CardDescription>
          </div>
          <Button 
             variant="ghost" 
             size="sm" 
             className="h-8 text-xs text-muted-foreground hover:text-destructive"
             onClick={onClearTimetable}
           >
             Clear All
           </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-6">
          <div className="flex-1 min-w-[800px] overflow-auto">
            <TimetablePreview 
              indexes={activeIndexes} 
              moduleCode={previewingModuleCode || "PLANNER"} 
              hideOverlay={true} 
              previewIndexes={activePreviewIndexes}
              hoveredPreviewIndex={hoveredPreviewIndex}
              colorBy="module"
              onIndexClick={handleIndexClick}
              selectedWeek={selectedWeek}
              onDeleteCustomEvent={onRemoveCustomEvent}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
