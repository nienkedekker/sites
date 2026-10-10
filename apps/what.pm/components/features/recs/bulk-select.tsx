"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { formatPlural } from "@nienke/ui/format";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/features/confirm-delete-dialog";
import type { PickKey } from "@/app/actions/recommendations";
import type { ValidItemType } from "@/types/shared";

const keyOf = (itemtype: ValidItemType, externalId: string) =>
  `${itemtype}|${externalId}`;

const SelectionContext = createContext<{
  selected: Set<string>;
  toggle: (key: string, on: boolean) => void;
} | null>(null);

// Checkboxes on a list's entries, with a bar to select them all and delete
// what's picked, after the same dialog as every other delete. The bar sticks
// to the top so it's there in a long list
export function BulkSelect({
  entries,
  noun,
  remove,
  children,
}: {
  entries: { itemtype: ValidItemType; external_id: string }[];
  noun: string;
  remove: (keys: PickKey[]) => Promise<{ error: string | null }>;
  children: ReactNode;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Entries removed some other way drop out of the selection
  const keys = entries.map((entry) => ({
    itemtype: entry.itemtype,
    externalId: entry.external_id,
  }));
  const chosen = keys.filter((key) =>
    picked.has(keyOf(key.itemtype, key.externalId)),
  );
  const selected = new Set(
    chosen.map((key) => keyOf(key.itemtype, key.externalId)),
  );
  const all = keys.length > 0 && chosen.length === keys.length;

  const toggle = (key: string, on: boolean) => {
    setPicked((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const selectAll = (on: boolean) => {
    setPicked(
      on
        ? new Set(keys.map((key) => keyOf(key.itemtype, key.externalId)))
        : new Set(),
    );
  };

  return (
    <SelectionContext value={{ selected, toggle }}>
      <div className="sticky top-0 z-10 mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 bg-paper py-3 font-mono text-xs text-ink-soft">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={all}
            onCheckedChange={(on) => selectAll(on === true)}
          />
          select all
        </label>
        {chosen.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span aria-live="polite">{chosen.length} selected</span>
            <span aria-hidden="true">·</span>
            <ConfirmDeleteDialog
              label="Delete selected"
              description={`This action cannot be undone. This will permanently delete ${formatPlural(chosen.length, noun)}.`}
              action={() => remove(chosen)}
              onDeleted={() => setPicked(new Set())}
            />
          </>
        )}
      </div>
      {children}
    </SelectionContext>
  );
}

export function SelectBox({
  itemtype,
  externalId,
  title,
}: {
  itemtype: ValidItemType;
  externalId: string;
  title: string;
}) {
  const selection = use(SelectionContext);
  if (!selection) return null;
  const key = keyOf(itemtype, externalId);
  return (
    <Checkbox
      checked={selection.selected.has(key)}
      onCheckedChange={(on) => selection.toggle(key, on === true)}
      aria-label={`Select ${title}`}
      className="mt-0.5"
    />
  );
}
