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
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  busy?: boolean;
  hint?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex items-center gap-3 border border-rule bg-panel pr-3 pl-5 focus-within:ring-2 focus-within:ring-accent/40">
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        className="w-full min-w-0 bg-transparent py-4 text-[22px] text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
        {...input}
      />
      {busy && (
        <span className="shrink-0 text-ink-soft" aria-hidden="true">
          <LoadingSpinner size={16} />
        </span>
      )}
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="icon-button size-9"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      ) : (
        hint && (
          <span
            className="shrink-0 pr-2 font-mono text-xs whitespace-nowrap text-ink-faint"
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
