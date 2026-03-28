"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TagsDropdownProps = {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  triggerLabel?: string;
  align?: "start" | "end";
  className?: string;
};

export function TagsDropdown({
  selectedTags,
  onTagsChange,
  triggerLabel,
  align = "end",
  className = "w-56",
  initialTags,
}: TagsDropdownProps & { initialTags?: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch tags from API
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const query = searchQuery.trim();
        const url = query
          ? `/api/tags?q=${encodeURIComponent(query)}`
          : `/api/tags`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.tags)) {
          setTags(data.tags);
        } else {
          setTags([]);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
        setTags([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchTags();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const parseTag = (tag: string) => {
    const match = tag.match(/^(.*)\((.*)\)$/);
    if (match) {
      return { label: match[1], description: match[2] };
    }
    return { label: tag, description: "" };
  };

  const getLabel = () => {
    if (triggerLabel) return triggerLabel;
    if (selectedTags.length === 0) return "Field tags";
    if (selectedTags.length === 1) return parseTag(selectedTags[0]).label;
    return `${selectedTags.length} tags`;
  };

  // Filter tags based on search and sort: selected tags first
  const filteredTags = tags
    .filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aSelected = selectedTags.includes(a);
      const bSelected = selectedTags.includes(b);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.localeCompare(b); // Alphabetical order for same selection status
    });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between px-3 py-2 text-sm", className)}
        >
          <span className="truncate">{getLabel()}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align={align}>
        <div className="p-2">
          <div className="relative mb-2">
            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search field tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-8 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="thin-scrollbar max-h-[300px] overflow-y-auto">
            {isLoading && tags.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredTags.length > 0 ? (
              filteredTags.map((tag) => {
                const { label, description } = parseTag(tag);
                const isSelected = selectedTags.includes(tag);
                return (
                  <DropdownMenuItem
                    key={tag}
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleTag(tag);
                    }}
                    className={cn(
                      "flex flex-col items-start gap-0.5 py-2 pl-4 text-left whitespace-normal break-words cursor-pointer transition-colors",
                      isSelected
                        ? "bg-orange-50 text-orange-600 focus:bg-orange-100 focus:text-orange-700"
                        : "text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
                    )}
                  >
                    <span className={cn("font-medium", isSelected && "text-orange-600")}>
                      {label}
                    </span>
                    {description && (
                      <span
                        className={cn(
                          "text-[10px]",
                          isSelected ? "text-orange-500/80" : "text-gray-500"
                        )}
                      >
                        {description}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="py-6 text-center text-sm text-gray-500">
                No matching field tags found
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
