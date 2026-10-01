"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { Module } from "@/shared/api/types";
import { useModuleReviews } from "@/shared/data/queries/module-reviews";
import { ModuleReviews } from "./ModuleReviews";
import { ModuleTopics } from "./ModuleTopics";
import type { ModuleWithIndexes } from "../../types";
import type { PreviewIndex } from "./module-detail/types";
import { ModuleDetailHeader } from "./module-detail/ModuleDetailHeader";
import { ModuleOverviewCard } from "./module-detail/ModuleOverviewCard";
import { ModuleIndexesCard } from "./module-detail/ModuleIndexesCard";

interface ModuleDetailViewProps {
  selectedModule: ModuleWithIndexes;
  onBack: () => void;
  onModuleClick: (module: Module) => void;
  dependencies: string[];
  showFlowchart: boolean;
  moduleTitles: Map<string, string>;
  previewIndexes: PreviewIndex[];
  setPreviewIndexes: React.Dispatch<React.SetStateAction<PreviewIndex[]>>;
}

/**
 * Detailed module view with prerequisites, indexes, and reviews.
 */
export function ModuleDetailView({
  selectedModule,
  onBack,
  onModuleClick,
  dependencies,
  showFlowchart,
  moduleTitles,
  previewIndexes,
  setPreviewIndexes,
}: ModuleDetailViewProps) {
  const { data: reviewsData } = useModuleReviews(selectedModule.code);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Search
      </Button>

      <ModuleDetailHeader module={selectedModule} reviews={reviewsData} />

      <div className="grid gap-6 mb-6">
        <ModuleOverviewCard
          module={selectedModule}
          dependencies={dependencies}
          showFlowchart={showFlowchart}
          moduleTitles={moduleTitles}
          onModuleClick={onModuleClick}
        />

        <ModuleIndexesCard
          module={selectedModule}
          previewIndexes={previewIndexes}
          setPreviewIndexes={setPreviewIndexes}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ModuleReviews moduleCode={selectedModule.code} />
          </div>
          <div>
            <ModuleTopics moduleCode={selectedModule.code} />
          </div>
        </div>
      </div>
    </div>
  );
}
