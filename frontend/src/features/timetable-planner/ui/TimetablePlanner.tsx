"use client";

/**
 * Timetable Planner Page
 *
 * Renders the timetable planner UI with state/actions provided by useTimetablePlanner.
 */

import { Slider } from "@/shared/ui/slider";
import { AddEventDialog } from "@/features/timetable-planner/ui/dialogs/AddEventDialog";
import { LoadPresetDialog } from "@/features/timetable-planner/ui/dialogs/LoadPresetDialog";
import { SavePresetDialog } from "@/features/timetable-planner/ui/dialogs/SavePresetDialog";
import { TimetableGrid } from "./components/TimetableGrid";
import { TimetableSidebar } from "./components/TimetableSidebar";
import { ScreenshotView } from "./components/ScreenshotView";
import { useTimetablePlanner } from "../hooks/useTimetablePlanner";

export default function TimetablePlanner() {
  const {
    state: {
      selectedModules,
      semester,
      customEvents,
      searchQuery,
      searchResults,
      isSearching,
      isGenerating,
      availableSemesters,
      selectedWeek,
      isAddEventDialogOpen,
      previewingModuleCode,
      hoveredPreviewIndex,
      isSaveDialogOpen,
      isLoadDialogOpen,
      activeTab,
      selectedIndexesForGeneration,
      generatedTimetables,
      currentTimetableIndex,
      filters,
      resultsPage,
      isAuthenticated,
      activeIndexes,
      activePreviewIndexes,
      totalAUs,
    },
    actions: {
      setSearchQuery,
      setSelectedWeek,
      setIsAddEventDialogOpen,
      setPreviewingModuleCode,
      setHoveredPreviewIndex,
      setIsSaveDialogOpen,
      setIsLoadDialogOpen,
      setActiveTab,
      setSelectedIndexesForGeneration,
      setResultsPage,
      setCurrentTimetableIndex,
      setFilters,
      setSemester,
      setCurrentTimetableName,
      handleScreenshot,
      handleLoadPreset,
      addModule,
      removeModule,
      reorderModule,
      handleIndexSelect,
      handleIndexClick,
      handleKeyDown,
      generateTimetable,
    },
    refs: { plannerRef, screenshotRef, searchContainerRef },
    storeActions: { addCustomEvent, removeCustomEvent, clearTimetable },
  } = useTimetablePlanner();

  return (
    <div className="h-screen flex flex-col pt-4 pb-20">
      <div ref={plannerRef} className="flex-1 flex overflow-hidden gap-x-4">
        <TimetableGrid
          activeIndexes={activeIndexes}
          previewingModuleCode={previewingModuleCode}
          activePreviewIndexes={activePreviewIndexes}
          hoveredPreviewIndex={hoveredPreviewIndex}
          handleIndexClick={handleIndexClick}
          selectedWeek={selectedWeek}
          onRemoveCustomEvent={removeCustomEvent}
          onClearTimetable={clearTimetable}
        />

        <TimetableSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
          selectedIndexesForGeneration={selectedIndexesForGeneration}
          setSelectedIndexesForGeneration={setSelectedIndexesForGeneration}
          onAddModule={addModule}
          onRemoveModule={removeModule}
          onRemoveCustomEvent={removeCustomEvent}
          onIndexSelect={handleIndexSelect}
          onReorderModule={reorderModule}
          onSearchKeyDown={handleKeyDown}
          onAddCustomEventOpen={() => setIsAddEventDialogOpen(true)}
          onLoadPresetOpen={() => setIsLoadDialogOpen(true)}
          onSavePresetOpen={() => setIsSaveDialogOpen(true)}
          onScreenshot={handleScreenshot}
          isAuthenticated={isAuthenticated}
          searchContainerRef={searchContainerRef}
          filters={filters}
          setFilters={setFilters}
          isGenerating={isGenerating}
          onGenerate={generateTimetable}
        />
      </div>

      <AddEventDialog
        isOpen={isAddEventDialogOpen}
        onClose={() => setIsAddEventDialogOpen(false)}
        onAdd={addCustomEvent}
      />

      <SavePresetDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        currentModules={selectedModules}
        customEvents={customEvents}
        semester={semester}
        onSaveSuccess={(name) => setCurrentTimetableName(name)}
      />

      <LoadPresetDialog
        isOpen={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        onLoad={handleLoadPreset}
      />

      {generatedTimetables.length > 0 && activeTab === "plan" && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-transparent border-t-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-card rounded-full px-4 py-3 flex items-center gap-3 border shadow-lg pointer-events-auto">
            <span className="font-semibold text-sm whitespace-nowrap min-w-[140px] text-center">
              Timetable {currentTimetableIndex + 1} of {generatedTimetables.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setResultsPage((p) => Math.max(0, p - 1))}
                disabled={resultsPage === 0}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                Back
              </button>

              {generatedTimetables.slice(resultsPage * 10, (resultsPage + 1) * 10).map((_, idx) => {
                const absoluteIndex = resultsPage * 10 + idx;
                return (
                  <button
                    key={absoluteIndex}
                    onClick={() => setCurrentTimetableIndex(absoluteIndex)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                      absoluteIndex === currentTimetableIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {absoluteIndex + 1}
                  </button>
                );
              })}

              <button
                onClick={() => setResultsPage((p) => p + 1)}
                disabled={(resultsPage + 1) * 10 >= generatedTimetables.length}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                More
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent border-t-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-2xl bg-card rounded-full px-6 py-3 flex items-center gap-4 border shadow-lg pointer-events-auto">
          <span className="font-semibold text-sm min-w-[100px] text-center">
            {selectedWeek === 0 ? "Show All Weeks" : `Week ${selectedWeek}`}
          </span>
          <Slider
            defaultValue={[0]}
            max={13}
            step={1}
            value={[selectedWeek]}
            onValueChange={(vals) => setSelectedWeek(vals[0]!)}
            className="flex-1 cursor-pointer"
          />
        </div>
      </div>

      <ScreenshotView
        ref={screenshotRef}
        activeIndexes={activeIndexes}
        selectedModules={selectedModules}
        customEvents={customEvents}
        semester={semester || "AY2025/2026 Semester 1"}
      />
    </div>
  );
}
