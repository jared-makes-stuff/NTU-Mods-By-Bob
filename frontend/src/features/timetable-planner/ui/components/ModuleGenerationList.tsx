"use client";

import { Card, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Clock } from "lucide-react";
import type { PlannerModule } from "@/shared/types/planner";
import {
  formatWeeks,
  getExamStatus,
  formatExamDateTime,
  formatExamDuration,
  getExamStatusTone,
  getUniqueIndexNumbers,
} from "../../utils";

interface ModuleGenerationListProps {
  selectedModules: PlannerModule[];
  totalAUs: number;
  selectedIndexesForGeneration: Set<string>;
  setSelectedIndexesForGeneration: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function ModuleGenerationList({
  selectedModules,
  totalAUs,
  selectedIndexesForGeneration,
  setSelectedIndexesForGeneration
}: ModuleGenerationListProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-sm">Total Modules ({selectedModules.length})</h2>
        <Badge variant="outline" className="text-xs">{totalAUs} AU</Badge>
      </div>
      {selectedModules.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No modules selected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Switch to &quot;Select Modules&quot; tab to add modules
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {selectedModules.map((module) => (
            <Card key={module.code}>
              <div className={`px-3 flex flex-col ${module.examDateTime ? 'pt-2 pb-1 gap-2' : 'py-2'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0">
                    <div className="flex flex-col overflow-hidden min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm flex-shrink-0">{module.code}</CardTitle>
                        <Badge variant="outline" className="text-[10px] h-5 px-1 flex-shrink-0">{module.au} AU</Badge>
                      </div>
                      <CardDescription className="text-xs truncate">
                        {module.name}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Index Selection Dropdown with Checkboxes */}
                    <Select
                      value="" // Don't control value, just use for display
                      disabled={!module.indexes || module.indexes.length === 0}
                    >
                      <SelectTrigger className="h-7 text-xs w-[120px]">
                        <SelectValue placeholder={
                          !module.indexes 
                            ? "Loading..." 
                            : `Select Indexes`
                        } />
                      </SelectTrigger>
                        <SelectContent className="max-h-[300px] min-w-[200px]" align="end">
                        {/* Select All Button */}
                        {module.indexes && module.indexes.length > 0 && (
                          <div className="px-2 pb-2 border-b mb-1">
                            <button
                              className="w-full text-xs py-1.5 px-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const allIndexKeys = Array.from(new Set(module.indexes?.map((idx) => idx.indexNumber) || []))
                                  .map(indexNum => `${module.code}-${indexNum}`);
                                setSelectedIndexesForGeneration(prev => {
                                  const newSet = new Set(prev);
                                  allIndexKeys.forEach(key => newSet.add(key));
                                  return newSet;
                                });
                              }}
                            >
                              Select All
                            </button>
                          </div>
                        )}
                        {getUniqueIndexNumbers(module.indexes).map((indexNum) => {
                          // Find all lessons for this index
                          const lessons = module.indexes?.filter(idx => idx.indexNumber === indexNum) || [];
                          const key = `${module.code}-${indexNum}`;
                          const isChecked = selectedIndexesForGeneration.has(key);
                          
                          return (
                            <div
                              key={indexNum}
                              className="relative flex items-start gap-2 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedIndexesForGeneration(prev => {
                                  const newSet = new Set(prev);
                                  if (isChecked) {
                                    newSet.delete(key);
                                  } else {
                                    newSet.add(key);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked: boolean) => {
                                  setSelectedIndexesForGeneration(prev => {
                                    const newSet = new Set(prev);
                                    if (checked) {
                                      newSet.add(key);
                                    } else {
                                      newSet.delete(key);
                                    }
                                    return newSet;
                                  });
                                }}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                className="mt-0.5"
                              />
                              <div className="flex flex-col gap-1 w-full flex-1">
                                <div className="font-semibold text-xs">{indexNum}</div>
                                <div className="text-[10px] text-muted-foreground space-y-1">
                                  {lessons.sort((a, b) => a.type.localeCompare(b.type)).map((lesson, i) => (
                                    <div key={i} className="grid grid-cols-[28px_28px_60px_1fr_auto] gap-x-1.5">
                                      <span className="font-medium">{lesson.type}</span>
                                      <span>{lesson.day.substring(0, 3)}</span>
                                      <span>{lesson.startTime.substring(0,2)}:{lesson.startTime.substring(2)}-{lesson.endTime.substring(0,2)}:{lesson.endTime.substring(2)}</span>
                                      <span className="truncate" title={lesson.venue || undefined}>{lesson.venue || "-"}</span>
                                      <span className="text-[9px] text-muted-foreground/70">{formatWeeks(lesson.weeks)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Exam Information */}
                {module.examDateTime && (() => {
                  const examStatus = getExamStatus(module, selectedModules);
                  return (
                  <div 
                    className={`text-xs border-t pt-1 flex items-center gap-1 ${getExamStatusTone(examStatus.status as 'clash' | 'tight' | 'normal')}`}
                    title={examStatus.message}
                  >
                    <Clock className="size-3 flex-shrink-0" />
                    <span className="font-medium mr-1">
                        Exam 
                        <span className="text-[10px] ml-1 font-normal opacity-70">
                          ({formatExamDuration(module.examDuration)})
                        </span>
                    </span>
                    <span className="truncate flex-1">
                        {formatExamDateTime(module.examDateTime)}
                    </span>
                  </div>
                  );
                })()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
