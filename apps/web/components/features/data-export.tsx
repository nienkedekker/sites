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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Export Your Data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download your reading and watching history in CSV or JSON format.
        </p>
      </div>

      {/* All Data Export */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Export All Data</h4>
        <div className="flex gap-3">
          <Button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
          <Button
            onClick={() => handleExport("json")}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            <Database className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Download JSON"}
          </Button>
        </div>
      </div>

      {/* Current Year Export */}
      {currentYear && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Export {currentYear} Data</h4>
          <div className="flex gap-3">
            <Button
              onClick={() => handleExport("csv", currentYear)}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : `${currentYear} CSV`}
            </Button>
            <Button
              onClick={() => handleExport("json", currentYear)}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : `${currentYear} JSON`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
