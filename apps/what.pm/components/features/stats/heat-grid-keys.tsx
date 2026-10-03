"use client";

import { useEffect } from "react";
import { bindHeatGrid } from "@nienke/ui/heat-grid";

export function HeatGridKeys({ tableId }: { tableId: string }) {
  useEffect(() => {
    const table = document.getElementById(tableId);
    if (table instanceof HTMLTableElement) return bindHeatGrid(table);
  }, [tableId]);

  return null;
}
