"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Eye, Trash2 } from "lucide-react";
import { parsePrerequisites } from "@/shared/lib/prerequisite-utils";
import {
  PlannedModule,
  SEMESTER_LABELS,
  YEARS,
  GRADE_OPTIONS,
  formatYear,
  getSemesterColor,
  calculateGPA,
} from "../../utils";

type ModuleGroup = {
  year: number;
  semester: number;
  modules: PlannedModule[];
};

interface TimelineTableBodyProps {
  sortedModules: PlannedModule[];
  selectedRows: Set<string>;
  toggleRowSelection: (id: string) => void;
  handleUpdatePlanned: <K extends keyof PlannedModule>(id: string, field: K, value: PlannedModule[K]) => void;
  handleRemoveModule: (id: string) => void;
}

const buildModuleGroups = (modules: PlannedModule[]): ModuleGroup[] => {
  const groups: ModuleGroup[] = [];
  let currentGroup: ModuleGroup | null = null;

  modules.forEach((module) => {
    if (!currentGroup || currentGroup.year !== module.year || currentGroup.semester !== module.semester) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = { year: module.year, semester: module.semester, modules: [] };
    }
    currentGroup.modules.push(module);
  });

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
};

const getPrerequisiteText = (prerequisites: PlannedModule['prerequisites']) => {
  if (!prerequisites) return '';
  if (typeof prerequisites === 'string') return prerequisites;
  if ('text' in prerequisites && typeof prerequisites.text === 'string') return prerequisites.text;
  return JSON.stringify(prerequisites);
};

function PrerequisitesCell({ module }: { module: PlannedModule }) {
  const moduleCodes = parsePrerequisites(module.prerequisites);
  const prerequisiteText = getPrerequisiteText(module.prerequisites);

  if (moduleCodes.length > 0) {
    return (
      <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
        <>
          {moduleCodes.slice(0, 3).map((code, idx) => (
            <Link key={idx} href={`/module-info?code=${code}`} title={`View ${code}`}>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-black"
              >
                {code}
              </Badge>
            </Link>
          ))}
          {moduleCodes.length > 3 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 px-1 text-xs">
                  <Eye className="size-3 mr-1" />
                  +{moduleCodes.length - 3}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Prerequisites for {module.code}</DialogTitle>
                  <DialogDescription>Full prerequisite requirements</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{prerequisiteText}</p>
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    {moduleCodes.map((code, idx) => (
                      <Link key={idx} href={`/module-info?code=${code}`}>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        >
                          {code}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      </div>
    );
  }

  if (module.prerequisites) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs text-black">
            <Eye className="size-3 mr-1" />
            View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prerequisites for {module.code}</DialogTitle>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap text-black">{prerequisiteText}</p>
        </DialogContent>
      </Dialog>
    );
  }

  return <span className="text-xs text-muted-foreground" style={{ color: '#666' }}>None</span>;
}

function TimelineModuleRow({
  module,
  isSelected,
  toggleRowSelection,
  handleUpdatePlanned,
  handleRemoveModule,
}: {
  module: PlannedModule;
  isSelected: boolean;
  toggleRowSelection: (id: string) => void;
  handleUpdatePlanned: <K extends keyof PlannedModule>(id: string, field: K, value: PlannedModule[K]) => void;
  handleRemoveModule: (id: string) => void;
}) {
  const bgColor = getSemesterColor(module.semester);
  const unavailableStyle = { color: module.isAvailable === false ? '#ef4444' : '#000' };

  return (
    <tr
      className="border-b hover:opacity-80 transition-opacity"
      style={{ backgroundColor: bgColor }}
    >
      <td className="p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleRowSelection(module.id)}
          className="cursor-pointer"
        />
      </td>
      <td className="p-3 font-mono text-sm font-medium" style={unavailableStyle}>
        {module.code}
      </td>
      <td className="p-3 text-sm" style={unavailableStyle}>
        {module.name || (
          <Input
            value={module.name}
            onChange={(e) => handleUpdatePlanned(module.id, "name", e.target.value)}
            placeholder="Enter module title..."
            className="h-6 text-xs italic text-muted-foreground border-dashed"
            style={{ color: '#666' }}
          />
        )}
      </td>
      <td className="p-3 text-sm">
        <PrerequisitesCell module={module} />
      </td>
      <td className="p-3 text-sm">
        {module.au > 0 ? (
          <Badge variant="outline" className="bg-slate-700 text-white border-slate-600 font-semibold">
            {module.au}
          </Badge>
        ) : (
          <Input
            type="number"
            min="0"
            value={module.au || ''}
            onChange={(e) => handleUpdatePlanned(module.id, "au", parseInt(e.target.value) || 0)}
            placeholder="AU"
            className="h-6 w-16 text-xs text-center"
            style={{ color: '#000' }}
          />
        )}
      </td>
      <td className="p-3">
        <Select
          value={module.grade || ""}
          onValueChange={(value) => handleUpdatePlanned(module.id, "grade", value)}
        >
          <SelectTrigger className="h-8 w-full" style={{ color: '#000' }}>
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.map((gradeOption) => (
              <SelectItem key={gradeOption.grade} value={gradeOption.grade}>
                {gradeOption.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-3">
        <Input
          value={module.remarks || ""}
          onChange={(e) => handleUpdatePlanned(module.id, "remarks", e.target.value)}
          placeholder="Add remarks..."
          className="h-8 text-xs"
          style={{ color: '#000' }}
        />
      </td>
      <td className="p-3">
        <Select
          value={module.year.toString()}
          onValueChange={(value) => handleUpdatePlanned(module.id, "year", parseInt(value))}
        >
          <SelectTrigger className="h-8 w-full min-w-[4rem]" style={{ color: '#000' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                Year {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-3">
        <Select
          value={module.semester.toString()}
          onValueChange={(value) => handleUpdatePlanned(module.id, "semester", parseInt(value) as 1 | 2 | 3 | 4)}
        >
          <SelectTrigger className="h-8 w-full min-w-[7rem]" style={{ color: '#000' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SEMESTER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-3">
        <Button variant="ghost" size="sm" onClick={() => handleRemoveModule(module.id)} className="h-8 w-8 p-0">
          <Trash2 className="size-4" style={{ color: '#000' }} />
        </Button>
      </td>
    </tr>
  );
}

function SemesterSummaryRow({ group }: { group: ModuleGroup }) {
  const { gpa, totalAU, countedAU } = calculateGPA(group.modules);
  return (
    <tr className="bg-gradient-to-r from-blue-900 to-blue-800 font-semibold border-t border-blue-300/20" style={{ color: '#fff' }}>
      <td className="p-3"></td>
      <td colSpan={2} className="p-3 text-sm text-left">
        {formatYear(group.year)} - {SEMESTER_LABELS[group.semester]} Summary
      </td>
      <td className="p-3 text-sm text-left">
        <span className="text-sm font-medium opacity-90">{group.modules.length} modules</span>
      </td>
      <td className="p-3 text-sm text-left">
        <Badge variant="secondary" className="bg-blue-100 text-blue-900 text-sm font-bold px-3 py-0.5">{totalAU} AU</Badge>
      </td>
      <td colSpan={5} className="p-3 text-sm text-right">
        <div className="flex items-center justify-end gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-help">
                <span>Semester GPA:</span>
                <span className="text-lg font-bold">{gpa.toFixed(2)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{countedAU} AU counted towards GPA</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

function OverallSummaryRow({ modules }: { modules: PlannedModule[] }) {
  const { gpa, totalAU, countedAU } = calculateGPA(modules);
  return (
    <tr className="bg-gradient-to-r from-green-900 to-green-800 font-bold border-t-2 border-green-300/30" style={{ color: '#fff' }}>
      <td className="p-3"></td>
      <td colSpan={2} className="p-3 text-base text-left">
        Overall Summary
      </td>
      <td className="p-3 text-sm text-left">
        <span className="text-sm font-medium opacity-90">{modules.length} modules</span>
      </td>
      <td className="p-3 text-sm text-left">
        <Badge variant="secondary" className="bg-green-100 text-green-900 text-sm font-bold px-3 py-0.5">
          {totalAU} AU
        </Badge>
      </td>
      <td colSpan={5} className="p-3 text-base text-right">
        <div className="flex items-center justify-end gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-help">
                <span>Cumulative GPA (CGPA):</span>
                <span className="text-xl font-bold">{gpa.toFixed(2)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{countedAU} AU counted towards GPA</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

export function TimelineTableBody({
  sortedModules,
  selectedRows,
  toggleRowSelection,
  handleUpdatePlanned,
  handleRemoveModule,
}: TimelineTableBodyProps) {
  const groups = buildModuleGroups(sortedModules);

  return (
    <tbody>
      {groups.map((group) => (
        <React.Fragment key={`group-${group.year}-${group.semester}`}>
          {group.modules.map((module) => (
            <TimelineModuleRow
              key={module.id}
              module={module}
              isSelected={selectedRows.has(module.id)}
              toggleRowSelection={toggleRowSelection}
              handleUpdatePlanned={handleUpdatePlanned}
              handleRemoveModule={handleRemoveModule}
            />
          ))}
          <SemesterSummaryRow group={group} />
        </React.Fragment>
      ))}

      {sortedModules.length > 0 && <OverallSummaryRow modules={sortedModules} />}
    </tbody>
  );
}
