import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error?: Error;
  reset?: () => void;
}

export function DataLoadingError({ error, reset }: ErrorFallbackProps) {
  return (
    <div role="alert" className="text-center p-8">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        Unable to load items
      </h2>
      <p className="text-red-600 dark:text-red-400 text-sm mb-4">
        There was a problem loading the data. This might be a temporary issue.
      </p>
      <div className="flex gap-2 justify-center">
        {reset && (
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
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
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-red-700 dark:text-red-300 text-xs mb-2">
            Error details (dev only)
          </summary>
          <pre className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded border overflow-auto">
            {error.message}
            {error.stack && "\n\n" + error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
