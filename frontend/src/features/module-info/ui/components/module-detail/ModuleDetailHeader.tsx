"use client";

import { Badge } from "@/shared/ui/badge";
import type { ModuleWithIndexes } from "../../../types";
import type { ReviewsResponse } from "@/shared/data/queries/module-reviews";

interface ModuleDetailHeaderProps {
  module: ModuleWithIndexes;
  reviews?: ReviewsResponse;
}

/**
 * Header section showing module identity and review summary.
 */
export function ModuleDetailHeader({ module, reviews }: ModuleDetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{module.code}</h1>
            <Badge variant="secondary" className="text-sm">{module.au} AU</Badge>
            <Badge variant="outline" className="text-sm">{module.school}</Badge>
          </div>
          <h2 className="text-xl text-muted-foreground">{module.name}</h2>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-lg">
          {reviews && reviews.totalReviews > 0 ? (
            <>
              <span className="text-2xl font-bold">{reviews.averageRating.toFixed(1)}</span>
              <div className="text-sm">
                <div className="text-muted-foreground">
                  ?. ({reviews.totalReviews} reviews)
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">N/A</span>
              <span className="text-lg text-muted-foreground">No reviews yet</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
