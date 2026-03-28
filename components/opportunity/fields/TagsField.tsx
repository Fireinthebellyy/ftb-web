"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Hash, X } from "lucide-react";
import { Control } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormData } from "../schema";

type Props = {
  control: Control<FormData>;
};

type AutosuggestProps = {
  value: string;
  onChange: (val: string) => void;
};

function composeTagsValue(committed: string[], activeToken = ""): string {
  const normalizedActiveToken = activeToken.trim();
  if (committed.length === 0) return normalizedActiveToken;
  if (!normalizedActiveToken) return `${committed.join(", ")}, `;
  return `${committed.join(", ")}, ${normalizedActiveToken}`;
}

function TagsAutosuggest({ value, onChange }: AutosuggestProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalizedValue = value || "";
  const allTokens = useMemo(
    () =>
      normalizedValue
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [normalizedValue]
  );

  const currentToken = useMemo(() => {
    const parts = normalizedValue.split(",");
    return parts[parts.length - 1]?.trim() || "";
  }, [normalizedValue]);

  const hasTrailingComma = useMemo(
    () => /,\s*$/.test(normalizedValue),
    [normalizedValue]
  );

  const committedTokens = useMemo(() => {
    if (allTokens.length === 0) return [];
    return hasTrailingComma ? allTokens : allTokens.slice(0, -1);
  }, [allTokens, hasTrailingComma]);

  const selectedTagSet = useMemo(
    () => new Set(committedTokens.map((token) => token.toLowerCase())),
    [committedTokens]
  );

  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      const q = currentToken;
      if (!q || q.length < 2) {
        setSuggestions([]);
        setShow(false);
        return;
      }
      try {
        const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=8`, {
          signal: controller.signal,
        });
        const data = await res.json();
        const list = Array.isArray(data.tags)
          ? data.tags.filter(
            (tag: string) => !selectedTagSet.has(tag.toLowerCase())
          )
          : [];
        setSuggestions(list);
        setShow(list.length > 0);
      } catch {
        setSuggestions([]);
        setShow(false);
      }
    }, 300);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [currentToken, selectedTagSet]);

  const parseTag = (tag: string) => {
    const match = tag.match(/^(.*)\((.*)\)$/);
    if (match) {
      return { label: match[1], description: match[2] };
    }
    return { label: tag, description: "" };
  };

  function addTag(tag: string) {
    const seen = new Set<string>();
    const result = [...committedTokens, tag].filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    onChange(composeTagsValue(result));
    setShow(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function removeTag(tagToRemove: string) {
    const result = committedTokens.filter(
      (token) => token.toLowerCase() !== tagToRemove.toLowerCase()
    );
    onChange(composeTagsValue(result, currentToken));
  }

  function handleInputChange(nextValue: string) {
    onChange(composeTagsValue(committedTokens, nextValue));
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && currentToken.trim()) {
      e.preventDefault();
      addTag(currentToken.trim());
      return;
    }

    if (
      e.key === "Backspace" &&
      !currentToken &&
      committedTokens.length > 0
    ) {
      e.preventDefault();
      const result = committedTokens.slice(0, -1);
      onChange(composeTagsValue(result));
    }
  }

  return (
    <div className="relative w-full">
      <div
        className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md bg-transparent px-2 py-1 text-sm focus-within:ring-1 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {committedTokens.map((tag) => {
          const { label, description } = parseTag(tag);
          return (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
              title={description}
            >
              {label}
              <button
                type="button"
                className="rounded-full p-0.5 text-blue-700 hover:bg-blue-300/60"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        <Input
          value={currentToken}
          ref={inputRef}
          autoComplete="off"
          placeholder={committedTokens.length === 0 ? "Add field tags *" : "Add more"}
          className="h-8 min-w-24 flex-1 border-none px-1 shadow-none focus-visible:ring-0"
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShow(suggestions.length > 0)}
          onBlur={() =>
            setTimeout(() => {
              if (!hovering) setShow(false);
            }, 120)
          }
          onKeyDown={handleInputKeyDown}
        />
      </div>
      {show && (
        <div
          className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-md"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        >
          {suggestions.map((tag) => {
            const { label, description } = parseTag(tag);
            return (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(tag)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex flex-col gap-0.5"
              >
                <span className="text-sm font-medium">{label}</span>
                {description && (
                  <span className="text-[10px] text-gray-500 line-clamp-1">
                    {description}
                  </span>
                )}
              </button>
            );
          })}
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
          <FormControl>
            <div className="flex items-center gap-2 pt-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <TagsAutosuggest value={field.value} onChange={field.onChange} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
