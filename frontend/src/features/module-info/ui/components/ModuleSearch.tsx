"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Checkbox } from "@/shared/ui/checkbox";
import { useAvailableSemesters, useSchools } from "@/shared/data/queries/catalogue";

interface ModuleSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  
  filterSemester: string;
  setFilterSemester: (val: string) => void;
  filterAuMin: string;
  setFilterAuMin: (val: string) => void;
  filterAuMax: string;
  setFilterAuMax: (val: string) => void;
  filterLevel: string;
  setFilterLevel: (val: string) => void;
  filterGradingType: string;
  setFilterGradingType: (val: string) => void;
  filterBde: boolean;
  setFilterBde: (val: boolean) => void;
  filterUe: boolean;
  setFilterUe: (val: boolean) => void;
  filterSchool: string;
  setFilterSchool: (val: string) => void;
  filterDays: string[];
  setFilterDays: (val: string[]) => void;
}

export function ModuleSearch({
  searchQuery, setSearchQuery, onSearch,
  filterSemester, setFilterSemester,
  filterAuMin, setFilterAuMin,
  filterAuMax, setFilterAuMax,
  filterLevel, setFilterLevel,
  filterGradingType, setFilterGradingType,
  filterBde, setFilterBde,
  filterUe, setFilterUe,
  filterSchool, setFilterSchool,
  filterDays, setFilterDays
}: ModuleSearchProps) {
  const { data: semesters = [] } = useAvailableSemesters();
  const { data: schools = [] } = useSchools();

  const formatSemester = (sem: string) => {
    const [year, term] = sem.split('_');
    const nextYear = (parseInt(year) + 1).toString().slice(-2);
    const termLabel = term === 'S' ? 'Special' : `Sem ${term}`;
    return `AY${year}/${nextYear} ${termLabel}`;
  };

  return (
    <div className="relative mb-8 max-w-2xl mx-auto flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by code or name..."
          className="pl-9 h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
            <Filter className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filter Modules</h4>
              <p className="text-sm text-muted-foreground">
                Refine your search results
              </p>
            </div>
            <div className="grid gap-4">
              {/* Academic Year and Semester */}
              <div className="grid gap-2">
                <Label htmlFor="semester-filter">Academic Year & Semester</Label>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map((sem: string) => (
                      <SelectItem key={sem} value={sem}>{formatSemester(sem)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* School */}
              <div className="grid gap-2">
                <Label htmlFor="school-filter">School</Label>
                <Select value={filterSchool} onValueChange={setFilterSchool}>
                  <SelectTrigger id="school-filter" className="w-full h-8">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools.map((school: string) => (
                      <SelectItem key={school} value={school}>{school}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Units */}
              <div className="grid gap-2">
                <Label htmlFor="au-filter">Academic Units</Label>
                <div className="flex gap-2">
                  <Input 
                    id="min-au-filter" 
                    placeholder="Min" 
                    className="h-8" 
                    type="number" 
                    min="0"
                    value={filterAuMin}
                    onChange={(e) => setFilterAuMin(e.target.value)}
                  />
                  <Input 
                    id="max-au-filter" 
                    placeholder="Max" 
                    className="h-8" 
                    type="number" 
                    min="0"
                    value={filterAuMax}
                    onChange={(e) => setFilterAuMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Grading System */}
              <div className="grid gap-2">
                <Label htmlFor="grading-filter">Grading System</Label>
                <Select value={filterGradingType} onValueChange={setFilterGradingType}>
                  <SelectTrigger id="grading-filter" className="h-8">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="letter">Letter Graded</SelectItem>
                    <SelectItem value="passFail">Pass/Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="grid gap-2">
                <Label htmlFor="level-filter">Level</Label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger id="level-filter" className="h-8">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1000">Level 1000</SelectItem>
                    <SelectItem value="2000">Level 2000</SelectItem>
                    <SelectItem value="3000">Level 3000</SelectItem>
                    <SelectItem value="4000">Level 4000</SelectItem>
                    <SelectItem value="5000">Level 5000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BDE/UE Eligible */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bde-filter" 
                    checked={filterBde}
                    onCheckedChange={(checked) => setFilterBde(checked as boolean)}
                  />
                  <Label htmlFor="bde-filter">BDE Eligible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ue-filter" 
                    checked={filterUe}
                    onCheckedChange={(checked) => setFilterUe(checked as boolean)}
                  />
                  <Label htmlFor="ue-filter">UE Eligible</Label>
                </div>
              </div>

              {/* Class Dates */}
              <div className="grid gap-2">
                <Label>Class Dates</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day}`} 
                        checked={filterDays.includes(day)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterDays([...filterDays, day]);
                          } else {
                            setFilterDays(filterDays.filter(d => d !== day));
                          }
                        }}
                      />
                      <Label htmlFor={`day-${day}`} className="text-xs">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={() => onSearch(searchQuery)}>Apply Filters</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
