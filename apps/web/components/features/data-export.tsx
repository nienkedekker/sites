"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Database, Calendar } from "lucide-react";

interface DataExportProps {
  currentYear?: number;
}

export function DataExport({ currentYear }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "json", year?: number) => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      params.set("format", format);
      if (year) {
        params.set("year", year.toString());
      }

      const response = await fetch(`/export/download?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Get filename from Content-Disposition header or generate default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `whatpm-export.${format}`;

      // Create download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="card divide-y divide-line px-6 sm:px-7">
      <section className="space-y-4 py-6 sm:py-7">
        <h2 className="font-medium tracking-[-0.01em]">Export all data</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            <FileText aria-hidden="true" />
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
          <Button
            onClick={() => handleExport("json")}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            <Database aria-hidden="true" />
            {isExporting ? "Exporting..." : "Download JSON"}
          </Button>
        </div>
      </section>

      {currentYear && (
        <section className="space-y-4 py-6 sm:py-7">
          <h2 className="font-medium tracking-[-0.01em]">
            Export {currentYear} data
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleExport("csv", currentYear)}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              <Calendar aria-hidden="true" />
              {isExporting ? "Exporting..." : `${currentYear} CSV`}
            </Button>
            <Button
              onClick={() => handleExport("json", currentYear)}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              <Calendar aria-hidden="true" />
              {isExporting ? "Exporting..." : `${currentYear} JSON`}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
