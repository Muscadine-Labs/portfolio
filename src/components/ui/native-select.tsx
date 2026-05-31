"use client";

import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NativeSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface NativeSelectProps {
  id?: string;
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  options: readonly NativeSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** Reliable dropdown for drawers (no portal / focus-trap conflicts). */
export function NativeSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
}: NativeSelectProps) {
  const selectValue = value ?? "";

  return (
    <div data-slot="native-select" className={cn("relative w-full", className)}>
      <select
        id={id}
        disabled={disabled}
        value={selectValue}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30",
          !selectValue && placeholder ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
