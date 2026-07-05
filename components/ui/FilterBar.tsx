"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedType: string | null;
  setSelectedType: (val: string | null) => void;
}

const TYPES = ["Shirts", "Pants", "T-Shirts"];

export function FilterBar({ searchQuery, setSearchQuery, selectedType, setSelectedType }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
      <div className="relative w-full sm:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 bg-secondary border-transparent focus:bg-background focus:border-border rounded-lg text-sm transition-colors outline-none focus:ring-0 placeholder:text-muted-foreground"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar scroll-smooth">
        <button
          onClick={() => setSelectedType(null)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
            selectedType === null 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          All
        </button>
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              selectedType === type 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
