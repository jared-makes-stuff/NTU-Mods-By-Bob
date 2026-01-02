"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { ModuleList } from "./ModuleList";
import { FilterPanel } from "./FilterPanel";
import type { GenerationFilters } from "../../types";
import { GenerateOptionsCard } from "./GenerateOptionsCard";
import { ModuleGenerationList } from "./ModuleGenerationList";
import type { Module } from "@/shared/api/types";
import type { PlannerModule } from "@/shared/types/planner";
import type { CustomEvent } from "@/features/planner";

interface TimetableSidebarProps {
  activeTab: "modules" | "plan";
  setActiveTab: (tab: "modules" | "plan") => void;
  
  // Props for ModuleList
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
  previewingModuleCode: string | null;
  setPreviewingModuleCode: (val: string | null) => void;
  setHoveredPreviewIndex: (val: string | null) => void;
  selectedIndexesForGeneration: Set<string>;
  setSelectedIndexesForGeneration: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAddModule: (module: Module) => void;
  onRemoveModule: (code: string) => void;
  onRemoveCustomEvent: (id: string) => void;
  onIndexSelect: (moduleCode: string, indexNumber: string) => void;
  onReorderModule: (dragIndex: number, hoverIndex: number) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddCustomEventOpen: () => void;
  onLoadPresetOpen: () => void;
  onSavePresetOpen: () => void;
  onScreenshot: () => void;
  isAuthenticated: boolean;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;

  // Props for FilterPanel
  filters: GenerationFilters;
  setFilters: React.Dispatch<React.SetStateAction<GenerationFilters>>;

  // Props for GenerateOptionsCard
  isGenerating: boolean;
  onGenerate: () => void;
}

export function TimetableSidebar({
  activeTab, setActiveTab,
  semester, setSemester, availableSemesters,
  searchQuery, setSearchQuery, searchResults, isSearching,
  selectedModules, totalAUs, customEvents,
  previewingModuleCode, setPreviewingModuleCode, setHoveredPreviewIndex,
  selectedIndexesForGeneration, setSelectedIndexesForGeneration,
  onAddModule, onRemoveModule, onRemoveCustomEvent, onIndexSelect, onReorderModule, onSearchKeyDown,
  onAddCustomEventOpen, onLoadPresetOpen, onSavePresetOpen, onScreenshot,
  isAuthenticated,
  searchContainerRef,
  filters, setFilters,
  isGenerating, onGenerate
}: TimetableSidebarProps) {
  return (
    <div className="w-96 flex flex-col overflow-hidden">
      <Card className="flex flex-col flex-1 overflow-hidden">
        {/* Tabs Navigation */}
        <div className="flex border-b p-0 flex-shrink-0 relative">
          <button
            onClick={() => setActiveTab("modules")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "modules"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Select Modules
          </button>
          <button
            onClick={() => setActiveTab("plan")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "plan"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Generate
          </button>
        </div>

        {/* Tab Content */}
        <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === "modules" ? (
            <ModuleList 
              semester={semester}
              setSemester={setSemester}
              availableSemesters={availableSemesters}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              selectedModules={selectedModules}
              totalAUs={totalAUs}
              customEvents={customEvents}
              previewingModuleCode={previewingModuleCode}
              setPreviewingModuleCode={setPreviewingModuleCode}
              setHoveredPreviewIndex={setHoveredPreviewIndex}
              onAddModule={onAddModule}
              onRemoveModule={onRemoveModule}
              onRemoveCustomEvent={onRemoveCustomEvent}
              onIndexSelect={onIndexSelect}
              onReorderModule={onReorderModule}
              onSearchKeyDown={onSearchKeyDown}
              onAddCustomEventOpen={onAddCustomEventOpen}
              onLoadPresetOpen={onLoadPresetOpen}
              onSavePresetOpen={onSavePresetOpen}
              onScreenshot={onScreenshot}
              isAuthenticated={isAuthenticated}
              searchContainerRef={searchContainerRef}
            />
          ) : (
            <div className="space-y-6">
              <ModuleGenerationList 
                 selectedModules={selectedModules}
                 totalAUs={totalAUs}
                 selectedIndexesForGeneration={selectedIndexesForGeneration}
                 setSelectedIndexesForGeneration={setSelectedIndexesForGeneration}
              />

              <FilterPanel filters={filters} setFilters={setFilters} />
              
              <GenerateOptionsCard 
                selectedModulesLength={selectedModules.length}
                isGenerating={isGenerating}
                onGenerate={onGenerate}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
