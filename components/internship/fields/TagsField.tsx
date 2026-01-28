"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { InternshipFormData } from "../schema";

type Props = {
  control: Control<InternshipFormData>;
};

type AutosuggestProps = {
  value: string;
  onChange: (val: string) => void;
};

function TagsAutosuggest({ value, onChange }: AutosuggestProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentToken = useMemo(() => {
    const parts = (value || "").split(",");
    return parts[parts.length - 1]?.trim() || "";
  }, [value]);

  useEffect(() => {
    const id = setTimeout(async () => {
      const q = currentToken;
      if (!q) {
        setSuggestions([]);
        setShow(false);
        return;
      }
      try {
        const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        const list = Array.isArray(data.tags) ? data.tags : [];
        setSuggestions(list);
        setShow(list.length > 0);
      } catch {
        setSuggestions([]);
        setShow(false);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [currentToken]);

  function addTag(tag: string) {
    const parts = (value || "")
      .split(",")
      .map((t: string) => t.trim());

    if (parts.length === 0) {
      onChange(tag);
    } else {
      parts[parts.length - 1] = tag;
      const seen = new Set<string>();
      const result = parts
        .filter(Boolean)
        .filter((t) => {
          if (seen.has(t.toLowerCase())) return false;
          seen.add(t.toLowerCase());
          return true;
        });
      onChange(result.join(", "));
    }
    setShow(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="relative w-full">
      <Input
        value={value ?? ""}
        ref={inputRef}
        autoComplete="off"
        placeholder="Javascript, React, Frontend, etc."
        className="focus-visible:ring-1"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShow(suggestions.length > 0)}
        onBlur={() => setTimeout(() => { if (!hovering) setShow(false) }, 120)}
      />
      {show && (
        <div
          className="absolute z-50 mt-2 w-full rounded-md border bg-white shadow-md max-h-60 overflow-y-auto"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        >
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(tag)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
            >
              {tag}
            </button>
          ))}
          {suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>
          )}
        </div>
      )}
    </div>
  );
}

export function TagsField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="tags"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tags</FormLabel>
          <FormControl>
            <div className="relative">
              <TagsAutosuggest value={field.value || ""} onChange={field.onChange} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
