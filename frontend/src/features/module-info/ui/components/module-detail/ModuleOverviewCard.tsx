"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PrerequisiteFlowChart } from "@/features/module-info/ui/prerequisites/PrerequisiteFlowChart";
import { formatDuration } from "@/features/module-info/utils";
import type { Module } from "@/shared/api/types";
import type { ModuleWithIndexes } from "../../../types";
import { isLikelyModuleCode } from "./moduleDetailUtils";

interface ModuleOverviewCardProps {
  module: ModuleWithIndexes;
  dependencies: string[];
  showFlowchart: boolean;
  moduleTitles: Map<string, string>;
  onModuleClick: (module: Module) => void;
}

/**
 * Displays core module metadata, prerequisites, and restrictions.
 */
export function ModuleOverviewCard({
  module,
  dependencies,
  showFlowchart,
  moduleTitles,
  onModuleClick,
}: ModuleOverviewCardProps) {
  const renderExamInfo = () => {
    const examDateStr = module.examDate || module.examDateTime;
    if (!examDateStr) {
      return <p className="text-sm text-muted-foreground">No exam scheduled</p>;
    }

    let isPastExam = false;
    try {
      const examDate = new Date(examDateStr);
      if (!Number.isNaN(examDate.getTime())) {
        isPastExam = examDate < new Date();
      }
    } catch {
      // Show the exam string even if parsing fails.
    }

    return (
      <div className="text-sm space-y-1">
        <div className={isPastExam ? "text-muted-foreground/60" : "text-muted-foreground"}>
          <span className="font-medium text-foreground">
            {isPastExam ? "Previous Semester:" : "Date:"}
          </span>
          <span className="ml-2">{examDateStr}</span>
        </div>
        {module.examDuration && (
          <div className={isPastExam ? "text-muted-foreground/60" : "text-muted-foreground"}>
            <span className="font-medium text-foreground">Duration:</span>
            <span className="ml-2">{formatDuration(module.examDuration)}</span>
          </div>
        )}
        {isPastExam && (
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            Note: This exam date is from a past semester. Check official sources for current semester exam schedules.
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Description</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm leading-relaxed">
            {module.description || "No description available."}
          </p>
        </div>

        <div>
          {showFlowchart && (
            <h3 className="font-semibold mb-4">Prerequisites &amp; Dependencies:</h3>
          )}
          <PrerequisiteFlowChart
            moduleCode={module.code}
            prerequisites={module.prerequisites}
            dependencies={dependencies}
            onModuleClick={(code) => onModuleClick({ code } as Module)}
          />
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Mutually exclusive with:</h3>
              {module.mutualExclusions && module.mutualExclusions.trim() !== "" ? (
                <div className="flex gap-2 flex-wrap">
                  {module.mutualExclusions.split(/[,;]/).map((preclusion, idx) => {
                    const code = preclusion.trim();
                    if (!code) return null;

                    if (isLikelyModuleCode(code)) {
                      const upperCode = code.toUpperCase();
                      const title = moduleTitles.get(upperCode);
                      const tooltipText = title ? `${upperCode} - ${title}` : upperCode;

                      return (
                        <Badge
                          key={`${upperCode}-${idx}`}
                          variant="destructive"
                          className="bg-red-600 cursor-pointer hover:bg-red-700 transition-colors"
                          onClick={() => onModuleClick({ code } as Module)}
                          title={tooltipText}
                        >
                          {code}
                        </Badge>
                      );
                    }

                    return (
                      <Badge key={`${code}-${idx}`} variant="destructive" className="bg-red-600">
                        {code}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">none</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Not available to Programme:</h3>
              {module.notAvailableTo && module.notAvailableTo.trim() !== "" ? (
                <p className="text-sm text-muted-foreground">{module.notAvailableTo}</p>
              ) : (
                <p className="text-sm text-muted-foreground">none</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Not available to all Programme with:</h3>
              {module.notAvailableToAllWith && module.notAvailableToAllWith.trim() !== "" ? (
                <p className="text-sm text-muted-foreground">{module.notAvailableToAllWith}</p>
              ) : (
                <p className="text-sm text-muted-foreground">none</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Not available as BDE/UE to Programme:</h3>
              {module.notAvailableAsBdeUeTo && module.notAvailableAsBdeUeTo.trim() !== "" ? (
                <p className="text-sm text-muted-foreground">{module.notAvailableAsBdeUeTo}</p>
              ) : (
                <p className="text-sm text-muted-foreground">none</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Grading System:</h3>
              <p className="text-sm">
                {!module.gradeType || module.gradeType === null
                  ? "Letter Graded"
                  : module.gradeType.toLowerCase().includes("pass")
                    ? "Pass/Fail Graded"
                    : "Letter Graded"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Exam Information
              </h3>
              {renderExamInfo()}
            </div>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Notes:</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={
                module.bde ? "text-orange-600 border-orange-600" : "text-muted-foreground border-muted"
              }
            >
              {module.bde ? "Offered as BDE" : "Not offered as BDE"}
            </Badge>
            <Badge
              variant="outline"
              className={
                module.unrestrictedElective
                  ? "text-orange-600 border-orange-600"
                  : "text-muted-foreground border-muted"
              }
            >
              {module.unrestrictedElective
                ? "Offered as Unrestricted Elective"
                : "Not offered as Unrestricted Elective"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
