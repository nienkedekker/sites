"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error?: Error;
  reset?: () => void;
}

export function DataLoadingError({ error, reset }: ErrorFallbackProps) {
  return (
    <div role="alert" className="panel max-w-xl">
      <AlertTriangle className="mb-4 size-6 text-danger" aria-hidden="true" />
      <h2 className="display mb-3 text-[1.875rem] text-ink">
        Unable to load items
      </h2>
      <p className="mb-6 text-ink-soft">
        There was a problem loading the data. This might be a temporary issue.
      </p>
      <div className="flex gap-2">
        {reset && (
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        )}
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          Refresh page
        </Button>
      </div>
      {error && process.env.NODE_ENV === "development" && (
        <details className="mt-6">
          <summary className="mb-2 cursor-pointer font-mono text-xs text-ink-soft">
            Error details (dev only)
          </summary>
          <pre className="overflow-auto border border-line bg-panel-2 p-3 font-mono text-xs text-danger">
            {error.message}
            {error.stack && "\n\n" + error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
