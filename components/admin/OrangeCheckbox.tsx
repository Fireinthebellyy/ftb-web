import { cn } from "@/lib/utils";

interface OrangeCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

export function OrangeCheckbox({ checked, onChange }: OrangeCheckboxProps) {
  return (
    <label className="relative inline-flex cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        className="sr-only"
        onChange={onChange}
      />
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
          checked
            ? "border-orange-500 bg-orange-500"
            : "border-gray-300 bg-white hover:border-orange-300"
        )}
      >
        {checked ? (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          >
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        ) : null}
      </span>
    </label>
  );
}
