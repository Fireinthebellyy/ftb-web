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
import { useRef, useState } from "react";
import { InternshipFormData } from "../schema";

interface Props {
  control: Control<InternshipFormData>;
}

interface EligibilityInputProps {
  value: string[];
  onChange: (val: string[]) => void;
}

function EligibilityInput({ value, onChange }: EligibilityInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      // Support comma-separated values
      const items = inputValue.split(",").map((item) => item.trim()).filter(Boolean);
      if (items.length > 0) {
        const seen = new Set<string>();
        const newArray = [...(value || []), ...items]
          .filter(Boolean)
          .filter((t) => {
            if (seen.has(t.toLowerCase())) return false;
            seen.add(t.toLowerCase());
            return true;
          });
        onChange(newArray);
        setInputValue("");
        inputRef.current?.focus();
      }
    } else if (e.key === "Backspace" && !inputValue && value && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    // Also add items on blur if there's input
    if (inputValue.trim()) {
      const items = inputValue.split(",").map((item) => item.trim()).filter(Boolean);
      if (items.length > 0) {
        const seen = new Set<string>();
        const newArray = [...(value || []), ...items]
          .filter(Boolean)
          .filter((t) => {
            if (seen.has(t.toLowerCase())) return false;
            seen.add(t.toLowerCase());
            return true;
          });
        onChange(newArray);
        setInputValue("");
        inputRef.current?.focus();
      }
    }
  }

  return (
    <div className="space-y-2">
      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="hover:text-blue-600"
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={inputValue}
        ref={inputRef}
        autoComplete="off"
        placeholder="e.g., B.Tech (Press Enter)"
        className="focus-visible:ring-1"
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  );
}

export function EligibilityField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="eligibility"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Eligibility</FormLabel>
          <FormControl>
            <EligibilityInput 
              value={field.value || []} 
              onChange={(val) => field.onChange(val.length > 0 ? val : undefined)} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
