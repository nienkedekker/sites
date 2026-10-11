"use client";

import type { ComponentProps, ReactNode, Ref } from "react";
import { X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function SearchField({
  ref,
  label,
  value,
  onValueChange,
  onClear,
  busy = false,
  hint,
  children,
  ...input
}: Omit<ComponentProps<"input">, "value" | "onChange" | "className"> & {
  ref?: Ref<HTMLInputElement>;
  // Read out, not shown
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  busy?: boolean;
  // A word on the right while there's nothing to clear, like "↵ to add"
  hint?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex items-end gap-4 border-b border-rule focus-within:border-movies focus-within:shadow-[0_1px_0_var(--movies)]">
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        className="display w-full min-w-0 bg-transparent pb-2.5 text-[1.875rem] text-ink outline-none placeholder:text-ink-faint sm:text-[2.25rem] [&::-webkit-search-cancel-button]:hidden"
        {...input}
      />
      {busy && (
        <span className="mb-3.5 shrink-0 text-ink-soft" aria-hidden="true">
          <LoadingSpinner size={16} />
        </span>
      )}
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="mb-1.5 grid size-9 shrink-0 cursor-pointer place-items-center text-ink-soft transition-colors hover:bg-panel-2 hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      ) : (
        hint && (
          <span
            className="mb-3.5 shrink-0 font-mono text-xs whitespace-nowrap text-ink-faint"
            aria-hidden="true"
          >
            {hint}
          </span>
        )
      )}
      {children}
    </div>
  );
}
