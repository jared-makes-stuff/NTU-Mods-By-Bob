"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, type ReadonlyURLSearchParams } from "next/navigation";
import { quickSearchModules } from "@/shared/api/catalogue";
import type { Module } from "@/shared/api/types";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderFilter } from "./HeaderFilter";

interface HeaderSearchControlsProps {
  searchParams: ReadonlyURLSearchParams;
}

const parseFilterDays = (daysParam: string | null): string[] => {
  if (!daysParam) return [];
  return daysParam.split(",").map((day) => day.trim()).filter(Boolean);
};

/**
 * Encapsulates search and filter state for the header.
 * Resets state when the parent re-mounts this component (keyed by URL params).
 */
export function HeaderSearchControls({ searchParams }: HeaderSearchControlsProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filterSemester, setFilterSemester] = useState(searchParams.get("semester") || "all");
  const [filterAuMin, setFilterAuMin] = useState(searchParams.get("minAU") || "");
  const [filterAuMax, setFilterAuMax] = useState(searchParams.get("maxAU") || "");
  const [filterLevel, setFilterLevel] = useState(searchParams.get("level") || "all");
  const [filterGradingType, setFilterGradingType] = useState(searchParams.get("gradingType") || "all");
  const [filterBde, setFilterBde] = useState(searchParams.get("bde") === "true");
  const [filterUe, setFilterUe] = useState(searchParams.get("ue") === "true");
  const [filterSchool, setFilterSchool] = useState(searchParams.get("school") || "all");
  const [filterDays, setFilterDays] = useState<string[]>(parseFilterDays(searchParams.get("days")));

  const [suggestions, setSuggestions] = useState<Module[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (filterSemester !== "all") params.set("semester", filterSemester);
    if (filterAuMin) params.set("minAU", filterAuMin);
    if (filterAuMax) params.set("maxAU", filterAuMax);
    if (filterLevel !== "all") params.set("level", filterLevel);
    if (filterGradingType !== "all") params.set("gradingType", filterGradingType);
    if (filterBde) params.set("bde", "true");
    if (filterUe) params.set("ue", "true");
    if (filterSchool !== "all") params.set("school", filterSchool);
    if (filterDays.length > 0) params.set("days", filterDays.join(","));

    if (params.toString()) {
      router.push(`/module-info?${params.toString()}`);
      setShowSuggestions(false);
    }
  };

  // Fetch suggestions with debounce.
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const response = await quickSearchModules(searchQuery, 5);
          setSuggestions(response.data || []);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle click outside to close suggestions.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 max-w-md w-full" ref={searchContainerRef}>
      <HeaderSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        onSearch={handleSearch}
        searchContainerRef={searchContainerRef}
      />
      <HeaderFilter
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
        onApplyFilters={() => handleSearch()}
      />
    </div>
  );
}
