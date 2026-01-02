"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { AlertCircle } from "lucide-react";
import type { Module } from "@/shared/api/types";

interface ModuleListProps {
  modules: Module[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onModuleClick: (module: Module) => void;
}

export function ModuleList({ modules, isLoading, error, hasSearched, onModuleClick }: ModuleListProps) {
  const getPrerequisitePreview = (prerequisites: Module['prerequisites']) => {
    if (!prerequisites) return '';
    if (typeof prerequisites === 'string') return prerequisites;
    if (typeof prerequisites === 'object') {
      if ('text' in prerequisites && typeof prerequisites.text === 'string') {
        return prerequisites.text;
      }
      return JSON.stringify(prerequisites);
    }
    return String(prerequisites);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Searching...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/50 bg-red-500/10 mb-6">
        <CardContent className="py-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="size-5" />
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (modules.length > 0) {
    return (
      <div className="grid gap-4">
        {modules.map((module) => (
          <Card
            key={`${module.code}-${module.semester || 'unknown'}`}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onModuleClick(module)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-1">{module.code} - {module.name}</CardTitle>
                  <CardDescription>{module.school}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary">{module.au} AU</Badge>
                  {module.semester && (
                    <Badge variant="outline" className="text-xs">
                      {module.semester.replace('_', ' Sem ')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {module.description}
              </p>
              <div className="flex gap-4 text-sm">
                {module.prerequisites && (
                  <div className="text-muted-foreground">
                    <span className="font-semibold">Prerequisites:</span>{" "}
                    {(() => {
                      const preview = getPrerequisitePreview(module.prerequisites);
                      return preview.length > 50 ? `${preview.substring(0, 50)}...` : preview;
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (hasSearched) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="size-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No Modules Found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search terms or filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
