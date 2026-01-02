"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Trash2, GraduationCap, Eraser } from "lucide-react";
import { PlannedModule } from "../../utils";
import { TimelineTableBody } from "./TimelineTableBody";

interface TimelineTableProps {
  plannedModules: PlannedModule[];
  selectedRows: Set<string>;
  toggleRowSelection: (id: string) => void;
  toggleSelectAll: () => void;
  handleRemoveModule: (id: string) => void;
  handleBulkDelete: () => void;
  handleUpdatePlanned: <K extends keyof PlannedModule>(id: string, field: K, value: PlannedModule[K]) => void;
  handleClearPlanner: () => void;
  sortedModules: PlannedModule[];
  totalAU: number;
}

export function TimelineTable({
  plannedModules, selectedRows, toggleRowSelection, toggleSelectAll,
  handleRemoveModule, handleBulkDelete, handleUpdatePlanned, handleClearPlanner,
  sortedModules, totalAU
}: TimelineTableProps) {
  return (
    <div className="flex-1 min-w-0">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Timeline</CardTitle>
            <CardDescription>
              {plannedModules.length} module{plannedModules.length !== 1 ? 's' : ''} - {totalAU} AU total
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  {selectedRows.size} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Selected
                </Button>
              </>
            )}
            {plannedModules.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPlanner}
              >
                <Eraser className="size-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {plannedModules.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg mb-2">No modules planned yet</p>
              <p className="text-sm text-muted-foreground">
                Search and add modules from the sidebar to get started
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="w-12 p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === plannedModules.length && plannedModules.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="p-3 text-left text-sm font-semibold w-32">Module Code</th>
                    <th className="p-3 text-left text-sm font-semibold">Title</th>
                    <th className="p-3 text-left text-sm font-semibold w-64">Prerequisites</th>
                    <th className="p-3 text-left text-sm font-semibold w-20">AU</th>
                    <th className="p-3 text-left text-sm font-semibold w-32">Grade</th>
                    <th className="p-3 text-left text-sm font-semibold w-64">Remarks</th>
                    <th className="p-3 text-left text-sm font-semibold w-24">Year</th>
                    <th className="p-3 text-left text-sm font-semibold w-32">Semester</th>
                    <th className="p-3 text-left text-sm font-semibold w-20"></th>
                  </tr>
                </thead>
                <TimelineTableBody
                  sortedModules={sortedModules}
                  selectedRows={selectedRows}
                  toggleRowSelection={toggleRowSelection}
                  handleUpdatePlanned={handleUpdatePlanned}
                  handleRemoveModule={handleRemoveModule}
                />
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
