"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card } from "@/shared/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

interface FilterSectionCardProps {
  title: string;
  tooltip: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  showContent?: boolean;
  contentClassName?: string;
}

/**
 * Collapsible section wrapper used by timetable generation filters.
 */
export function FilterSectionCard({
  title,
  tooltip,
  isExpanded,
  onToggle,
  children,
  showContent,
  contentClassName,
}: FilterSectionCardProps) {
  const shouldRenderContent = showContent ?? isExpanded;

  return (
    <Card
      className="py-1.5 px-2 gap-1 cursor-pointer hover:bg-accent/30 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium">{title}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {isExpanded ? (
          <ChevronUp className="size-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3 text-muted-foreground" />
        )}
      </div>
      {shouldRenderContent && (
        <div
          className={contentClassName ?? "pt-1"}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      )}
    </Card>
  );
}
