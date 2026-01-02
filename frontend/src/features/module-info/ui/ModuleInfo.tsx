"use client";

/**
 * Module Info Page
 *
 * Suspense boundary plus layout composition for the module search and detail flows.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ModuleDetailView } from "./components/ModuleDetailView";
import { ModuleList } from "./components/ModuleList";
import { ModuleSearch } from "./components/ModuleSearch";
import { useModuleInfo } from "../hooks/useModuleInfo";

export default function ModuleInfo() {
  const searchParams = useSearchParams();
  const contentKey = searchParams.toString();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModuleInfoContent key={contentKey} />
    </Suspense>
  );
}

function ModuleInfoContent() {
  const {
    state: {
      searchQuery,
      filterSemester,
      filterAuMin,
      filterAuMax,
      filterLevel,
      filterGradingType,
      filterBde,
      filterUe,
      filterSchool,
      filterDays,
      hasSearched,
      selectedModule,
      modules,
      dependencies,
      isLoading,
      isLoadingDetails,
      error,
      previewIndexes,
      moduleTitles,
      showFlowchart,
    },
    actions: {
      setSearchQuery,
      setFilterSemester,
      setFilterAuMin,
      setFilterAuMax,
      setFilterLevel,
      setFilterGradingType,
      setFilterBde,
      setFilterUe,
      setFilterSchool,
      setFilterDays,
      setPreviewIndexes,
      searchModules,
      handleModuleClick,
      handleBack,
    },
  } = useModuleInfo();

  if (selectedModule) {
    return (
      <ModuleDetailView
        selectedModule={selectedModule}
        onBack={handleBack}
        onModuleClick={handleModuleClick}
        dependencies={dependencies}
        showFlowchart={showFlowchart}
        moduleTitles={moduleTitles}
        previewIndexes={previewIndexes}
        setPreviewIndexes={setPreviewIndexes}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">Module Information</h1>
        <p className="text-center text-muted-foreground text-sm">
          Search for modules to view detailed information including course descriptions, academic units,
          prerequisites, and available indexes.
        </p>
      </div>

      <ModuleSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={searchModules}
        filterSemester={filterSemester}
        setFilterSemester={setFilterSemester}
        filterAuMin={filterAuMin}
        setFilterAuMin={setFilterAuMin}
        filterAuMax={filterAuMax}
        setFilterAuMax={setFilterAuMax}
        filterLevel={filterLevel}
        setFilterLevel={setFilterLevel}
        filterGradingType={filterGradingType}
        setFilterGradingType={setFilterGradingType}
        filterBde={filterBde}
        setFilterBde={setFilterBde}
        filterUe={filterUe}
        setFilterUe={setFilterUe}
        filterSchool={filterSchool}
        setFilterSchool={setFilterSchool}
        filterDays={filterDays}
        setFilterDays={setFilterDays}
      />

      {isLoadingDetails && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading module details...</p>
        </div>
      )}

      {!isLoadingDetails && (
        <ModuleList
          modules={modules}
          isLoading={isLoading}
          error={error}
          hasSearched={hasSearched}
          onModuleClick={handleModuleClick}
        />
      )}
    </div>
  );
}
