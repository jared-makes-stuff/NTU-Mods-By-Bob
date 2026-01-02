"use client";

import { Card, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Clock, BookOpen, Plus, X, Loader2, GripVertical, Save, FolderOpen, Camera } from "lucide-react";
import type { Module } from "@/shared/api/types";
import type { PlannerModule } from "@/shared/types/planner";
import type { CustomEvent } from "@/features/planner";
import {
  formatWeeks,
  getExamStatus,
  formatSemester,
  formatExamDateTime,
  formatExamDuration,
  getExamStatusTone,
  getUniqueIndexNumbers,
} from "../../utils";
import { useToast } from "@/shared/hooks/use-toast";

interface ModuleListProps {
  // State
  semester: string;
  setSemester: (val: string) => void;
  availableSemesters: string[];
  
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchResults: Module[];
  isSearching: boolean;
  
  selectedModules: PlannerModule[];
  totalAUs: number;
  customEvents: CustomEvent[];
  
  // UI State
  previewingModuleCode: string | null;
  setPreviewingModuleCode: (val: string | null) => void;
  setHoveredPreviewIndex: (val: string | null) => void;
  
  // Handlers
  onAddModule: (module: Module) => void;
  onRemoveModule: (code: string) => void;
  onRemoveCustomEvent: (id: string) => void;
  onIndexSelect: (moduleCode: string, indexNumber: string) => void;
  onReorderModule: (dragIndex: number, hoverIndex: number) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  
  // Dialog/Action Triggers
  onAddCustomEventOpen: () => void;
  onLoadPresetOpen: () => void;
  onSavePresetOpen: () => void;
  onScreenshot: () => void;
  
  // Auth
  isAuthenticated: boolean;
  
  // Refs
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function ModuleList({
  semester, setSemester, availableSemesters,
  searchQuery, setSearchQuery, searchResults, isSearching,
  selectedModules, totalAUs, customEvents,
  previewingModuleCode, setPreviewingModuleCode, setHoveredPreviewIndex,
  onAddModule, onRemoveModule, onRemoveCustomEvent, onIndexSelect, onReorderModule, onSearchKeyDown,
  onAddCustomEventOpen, onLoadPresetOpen, onSavePresetOpen, onScreenshot,
  isAuthenticated,
  searchContainerRef
}: ModuleListProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* Semester Selection */}
      <div>
        <h2 className="font-semibold mb-2 text-sm">Semester</h2>
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-full">
            <SelectValue>{semester ? formatSemester(semester) : "Loading..."}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSemesters.length > 0 && availableSemesters[0] !== "" ? (
              availableSemesters.map(sem => (
                <SelectItem key={sem} value={sem}>
                  {formatSemester(sem)}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-xs text-muted-foreground">Loading semesters...</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h2 className="font-semibold mb-2 text-sm">Add Module</h2>
        <div className="relative mb-2" ref={searchContainerRef}>
          <Input
            placeholder="Search modules (e.g. SC2002)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-md bg-popover text-popover-foreground shadow-md max-h-80 overflow-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <Loader2 className="size-4 animate-spin mx-auto" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((m) => (
                  <div
                    key={m.code}
                    className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center text-sm border-b last:border-0"
                    onClick={() => onAddModule(m)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-normal text-foreground">{m.code}</span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{m.au} AU</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground/70 truncate max-w-[250px]">{m.name}</span>
                    </div>
                    <Plus className="size-3 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  No results
                </div>
              )}
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          className="w-full h-8 text-xs border-dashed"
          onClick={onAddCustomEventOpen}
        >
          <Plus className="size-3 mr-1" />
          Add Custom Event
        </Button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-sm">Total Modules ({selectedModules.length})</h2>
          <Badge variant="outline" className="text-xs">{totalAUs} AU</Badge>
        </div>
        {selectedModules.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-8 text-center">
              <BookOpen className="size-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No modules selected
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {selectedModules.map((module, index) => (
              <Card 
                key={module.code}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
                  onReorderModule(dragIndex, index);
                }}
                className="hover:shadow-md transition-shadow"
              >
                <div className={`px-3 flex flex-col ${module.examDateTime ? 'pt-2 pb-1 gap-2' : 'py-2'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0">
                            <div 
                              className="cursor-move flex-shrink-0"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", index.toString());
                              }}
                            >
                              <GripVertical className="size-4 text-muted-foreground" />
                            </div>
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
                                                        {/* Index Selection Dropdown */}
                                                        <Select
                                                            open={previewingModuleCode === module.code}
                                                            value={module.selectedIndex || ""}
                                                            onValueChange={(value) => {
                                                              onIndexSelect(module.code, value);
                                                              setPreviewingModuleCode(null); // Close on selection
                                                            }}
                                                            onOpenChange={(open) => setPreviewingModuleCode(open ? module.code : null)}
                                                            disabled={!module.indexes || module.indexes.length === 0}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs w-[100px]">
                        
                                <SelectValue placeholder={
                                    !module.indexes 
                                        ? "Loading..." 
                                        : "Select"
                                }>
                                  {module.selectedIndex || "Select"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] min-w-[200px]" align="end">
                                {getUniqueIndexNumbers(module.indexes).map((indexNum) => {
                                    // Find all lessons for this index
                                    const lessons = module.indexes?.filter(idx => idx.indexNumber === indexNum) || [];
                                    return (
                                      <div
                                        key={indexNum}
                                        className="relative flex items-start gap-2 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
                                        onMouseEnter={() => setHoveredPreviewIndex(indexNum)}
                                        onMouseLeave={() => setHoveredPreviewIndex(null)}
                                      >
                                        {/* If this is meant to be standard SelectItem */}
                                        <SelectItem 
                                          key={indexNum} 
                                          value={indexNum} 
                                          className="text-xs py-2 w-full"
                                        >
                                          <div className="flex flex-col gap-1 w-full">
                                              <div className="font-semibold">{indexNum}</div>
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
                                        </SelectItem>
                                      </div>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        {/* Remove Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemoveModule(module.code)}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                    </div>
                    
                    {/* Exam Information */}
                    {module.examDateTime && (() => {
                      const examStatus = getExamStatus(module, selectedModules);
                      return (
                      <div 
                        className={`text-xs border-t pt-2 flex items-start gap-1.5 ${getExamStatusTone(examStatus.status as 'clash' | 'tight' | 'normal')}`}
                        title={examStatus.message}
                      >
                        <Clock className="size-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            Exam 
                            <span className="text-[10px] ml-1 font-normal opacity-70">
                              ({formatExamDuration(module.examDuration)})
                            </span>
                          </div>
                          <div className="truncate">{formatExamDateTime(module.examDateTime)}</div>
                        </div>
                      </div>
                      );
                    })()}
                </div>
              </Card>
            ))}
            {/* Custom Events List */}
            {customEvents.map((event) => (
              <Card key={event.id}>
                <div className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{event.title}</CardTitle>
                      <Badge variant="outline" className="text-[10px] h-5 px-1 bg-slate-100">Event</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.day} {event.startTime.substring(0, 2)}:{event.startTime.substring(2)} - {event.endTime.substring(0, 2)}:{event.endTime.substring(2)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveCustomEvent(event.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preset Buttons - Side by Side */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1 h-9"
          size="sm"
          onClick={() => {
            if (!isAuthenticated) {
              toast({
                title: "Login Required",
                description: "Please login to load saved presets.",
                variant: "destructive",
              });
              return;
            }
            onLoadPresetOpen();
          }}
        >
          <FolderOpen className="size-4 mr-2" />
          Load
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 h-9"
          size="sm"
          onClick={() => {
            if (!isAuthenticated) {
              toast({
                title: "Login Required",
                description: "Please login to save presets.",
                variant: "destructive",
              });
              return;
            }
            onSavePresetOpen();
          }}
          disabled={selectedModules.length === 0}
        >
          <Save className="size-4 mr-2" />
          Save
        </Button>
        <Button 
          variant="outline" 
          className="h-9 w-9 p-0 flex-shrink-0"
          size="sm"
          onClick={onScreenshot}
          title="Screenshot Timetable"
        >
          <Camera className="size-4" />
        </Button>
      </div>
    </div>
  );
}
