"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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
}: TagsDropdownProps) {
  const [tags, setTags] = useState<string[]>([]);
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

  const getLabel = () => {
    if (triggerLabel) return triggerLabel;
    if (selectedTags.length === 0) return "Tags";
    if (selectedTags.length === 1) return selectedTags[0];
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
        <Button variant="outline" className="w-full justify-between">
          {getLabel()}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={className} align={align}>
        {/* Search Input */}
        <div className="relative px-2 pb-2">
          <div className="relative pt-2">
            <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pr-9 pl-9"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute top-1/2 right-4 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tags List */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
                onSelect={(e) => e.preventDefault()}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-sm text-gray-500">
              {searchQuery ? "No tags found" : "No tags available"}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
