"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Plus, Search, Download, Upload, Loader2, GraduationCap, Save } from "lucide-react";
import type { Module } from "@/shared/api/types";
import { PlannedModule, exportToCSV, importFromCSV } from "../../utils";
import { getErrorMessage } from "@/shared/api/client";
import { AddCustomModuleDialog } from "./AddCustomModuleDialog";

interface CourseSidebarProps {
  plannedModules: PlannedModule[];
  selectedRows: Set<string>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleSearchKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isSearching: boolean;
  searchResults: Module[];
  handleAddModule: (module: Module) => void;
  handleAddPlaceholder: (type: 'MPE' | 'BDE' | 'UE') => void;
  handleAddCustomModule: (code: string, title: string, au: number) => void;
  totalAU: number;
  importError: string;
  setImportError: (val: string) => void;
  setPlannedModules: React.Dispatch<React.SetStateAction<PlannedModule[]>>;
  handleSavePlan: () => void;
  isSaving: boolean;
  isLoadingPlan: boolean;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function CourseSidebar({
  plannedModules, selectedRows,
  searchQuery, setSearchQuery, handleSearchKeyPress, isSearching, searchResults,
  handleAddModule, handleAddPlaceholder, handleAddCustomModule,
  totalAU,
  importError, setImportError, setPlannedModules,
  handleSavePlan, isSaving, isLoadingPlan,
  searchContainerRef
}: CourseSidebarProps) {
  return (
    <div className="w-80 flex-shrink-0">
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5" />
            Course Planner
          </CardTitle>
          <CardDescription>Configure and manage your plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Import/Export */}
          <div className="pb-4 border-b space-y-2">
            <h3 className="text-sm font-semibold">Import / Export</h3>
            {importError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {importError}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const modulesToExport = selectedRows.size > 0 
                    ? plannedModules.filter(m => selectedRows.has(m.id))
                    : plannedModules;
                  exportToCSV(modulesToExport);
                }}
                disabled={plannedModules.length === 0}
              >
                <Download className="size-3 mr-1" />
                Export {selectedRows.size > 0 ? `(${selectedRows.size})` : 'All'}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setImportError("");
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            const modules = await importFromCSV(file);
                            setPlannedModules(prev => [...prev, ...modules]);
                            setImportError("");
                          } catch (err: unknown) {
                            setImportError(getErrorMessage(err) || "Failed to import CSV");
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="size-3 mr-1" />
                    Import
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import a CSV file</p>
                  <p className="text-[10px] opacity-80 mt-1">Required columns: Module Code, Title, AU, Year, Semester</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Add Modules Section */}
          <div className="space-y-3" ref={searchContainerRef}>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Search className="size-4" />
              Add Modules
            </h3>
            <Input
              placeholder="Search by code or name... (Press Enter to add)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full"
            />
            
            {/* Placeholder Modules */}
            {!searchQuery && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Add placeholder modules:</p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPlaceholder('MPE')}
                    className="flex-1 px-0 text-xs h-7"
                  >
                    MPE
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPlaceholder('BDE')}
                    className="flex-1 px-0 text-xs h-7"
                  >
                    BDE
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPlaceholder('UE')}
                    className="flex-1 px-0 text-xs h-7"
                  >
                    UE
                  </Button>
                  <AddCustomModuleDialog onAdd={handleAddCustomModule} className="flex-1 px-0 text-xs h-7" />
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-8">
                    <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((module) => (
                    <div
                      key={module.code}
                      className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => handleAddModule(module)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {module.code}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {module.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {module.au} AU
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {module.school}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No modules found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {!searchQuery && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Modules:</span>
                <span className="font-semibold">{plannedModules.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total AU:</span>
                <Badge variant="default" className="text-base">{totalAU}</Badge>
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t flex justify-end">
          <Button 
            onClick={handleSavePlan}
            disabled={isSaving || isLoadingPlan}
          >
            {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Save Plan
          </Button>
        </div>
      </Card>
    </div>
  );
}
