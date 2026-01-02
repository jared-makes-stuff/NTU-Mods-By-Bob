"use client";

import { Loader2 } from "lucide-react";
import { CourseSidebar } from "./components/CourseSidebar";
import { TimelineTable } from "./components/TimelineTable";
import { useCoursePlanner } from "../hooks/useCoursePlanner";

export default function CoursePlanner() {
  const {
    state: {
      plannedModules,
      searchQuery,
      searchResults,
      isSearching,
      selectedRows,
      importError,
      isSaving,
      isLoadingPlan,
      sortedModules,
      totalAU,
    },
    actions: {
      handleSavePlan,
      handleAddModule,
      handleAddPlaceholder,
      handleAddCustomModule,
      handleClearPlanner,
      handleSearchKeyPress,
      handleRemoveModule,
      handleBulkDelete,
      handleUpdatePlanned,
      toggleRowSelection,
      toggleSelectAll,
    },
    refs: { searchContainerRef },
    setters: {
      setPlannedModules,
      setSearchQuery,
      setImportError,
    },
  } = useCoursePlanner();

  return (
    <div className="w-full min-h-screen px-6 py-8">
      {isLoadingPlan ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading your course plan...</span>
        </div>
      ) : (
        <div className="flex gap-6">
          <TimelineTable 
            plannedModules={plannedModules}
            selectedRows={selectedRows}
            toggleRowSelection={toggleRowSelection}
            toggleSelectAll={toggleSelectAll}
            handleRemoveModule={handleRemoveModule}
            handleBulkDelete={handleBulkDelete}
            handleUpdatePlanned={handleUpdatePlanned}
            handleClearPlanner={handleClearPlanner}
            sortedModules={sortedModules}
            totalAU={totalAU}
          />

          <CourseSidebar 
            plannedModules={plannedModules}
            selectedRows={selectedRows}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearchKeyPress={handleSearchKeyPress}
            isSearching={isSearching}
            searchResults={searchResults}
            handleAddModule={handleAddModule}
            handleAddPlaceholder={handleAddPlaceholder}
            handleAddCustomModule={handleAddCustomModule}
            totalAU={totalAU}
            importError={importError}
            setImportError={setImportError}
            setPlannedModules={setPlannedModules}
            handleSavePlan={handleSavePlan}
            isSaving={isSaving}
            isLoadingPlan={isLoadingPlan}
            searchContainerRef={searchContainerRef}
          />
        </div>
      )}
    </div>
  );
}
