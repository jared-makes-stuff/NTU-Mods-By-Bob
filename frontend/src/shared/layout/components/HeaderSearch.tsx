"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import type { Module } from "@/shared/api/types";

interface HeaderSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  suggestions: Module[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  onSearch: (e?: React.FormEvent) => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function HeaderSearch({
  searchQuery, setSearchQuery, suggestions, showSuggestions, setShowSuggestions, onSearch, searchContainerRef
}: HeaderSearchProps) {
  const router = useRouter();

  return (
    <div className="flex-1 relative" ref={searchContainerRef}>
      <form onSubmit={onSearch}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input 
          placeholder="Search modules..." 
          className="pl-9 h-9" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim().length >= 2) setShowSuggestions(true);
          }}
        />
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto z-50">
          {suggestions.map((module) => (
            <div
              key={module.code}
              className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
              onClick={() => {
                setSearchQuery(module.code); 
                setShowSuggestions(false);
                router.push(`/module-info?code=${encodeURIComponent(module.code)}`);
              }}
            >
              <div className="font-semibold">{module.code}</div>
              <div className="text-xs text-muted-foreground truncate">{module.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
