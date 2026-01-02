"use client";

import React, { forwardRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { TimetableDisplay } from "@/shared/ui/timetable/TimetableDisplay";
import type { IndexData } from "@/shared/types/timetable";
import type { PlannerModule } from "@/shared/types/planner";
import type { CustomEvent } from "@/features/planner";

interface ScreenshotViewProps {
  activeIndexes: IndexData[];
  selectedModules: PlannerModule[];
  customEvents: CustomEvent[];
  semester: string;
}

export const ScreenshotView = forwardRef<HTMLDivElement, ScreenshotViewProps>(
  ({ activeIndexes, selectedModules, customEvents, semester }, ref) => {
    const totalAUs = (selectedModules ?? []).reduce((sum, m) => sum + (Number(m.au) || 0), 0);

    return (
      <div 
        ref={ref} 
        className="flex bg-background min-w-[1400px] items-stretch gap-0" // No gap between columns
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: '-3000px', // Move off-screen but keep within reasonable bounds
          zIndex: -1000,
          // pointerEvents: 'none', // Removed to ensure element is considered 'interactive' enough to render fully if needed
          visibility: 'visible', // Explicitly visible
          backgroundColor: '#ffffff' // Ensure white background
        }} 
      >
        {/* Left Side: Timetable */}
        <div className="flex-1 min-w-[900px]">
          <Card className="h-full flex flex-col rounded-r-none border-r-0 shadow-none">
            <CardHeader>
              <CardTitle>Timetable Plan</CardTitle>
              <CardDescription>{semester}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-2">
               <div className="h-[900px] border rounded-md p-2">
                <TimetableDisplay 
                  indexes={activeIndexes} 
                  moduleCode="PLANNER" 
                  colorBy="module" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Module List */}
        <div className="w-[400px] flex-shrink-0">
          <Card className="h-full flex flex-col rounded-l-none shadow-none border-l">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Selected Modules</CardTitle>
                <Badge variant="secondary">{totalAUs} AU</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-3 bg-muted/10">
              {selectedModules.length === 0 && customEvents.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No modules selected
                </div>
              )}

              {selectedModules.map((module) => {
                const selectedIndexInfo = module.indexes?.find(i => i.indexNumber === module.selectedIndex);
                
                return (
                  <div key={module.code} className="p-3 border rounded-md bg-card shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{module.code}</span>
                          <Badge variant="outline" className="text-[10px] h-5">{module.au} AU</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{module.name}</p>
                      </div>
                    </div>
                    
                    {module.selectedIndex && (
                      <div className="mt-2 text-xs flex items-center gap-2 bg-muted/50 p-1.5 rounded">
                        <span className="font-semibold">Index: {module.selectedIndex}</span>
                        {selectedIndexInfo && <span className="text-muted-foreground ml-auto">{selectedIndexInfo.type}</span>}
                      </div>
                    )}
                  </div>
                );
              })}

              {customEvents.map((event) => (
                <div key={event.id} className="p-3 border border-dashed rounded-md bg-accent/20">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm">{event.title}</span>
                    <Badge variant="secondary" className="text-[10px]">Event</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.day} {event.startTime}-{event.endTime}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);

ScreenshotView.displayName = "ScreenshotView";
