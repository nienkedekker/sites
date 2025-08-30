import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

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

export function FormSubmissionError({ reset }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded"
    >
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Unable to save your changes
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            Please check your information and try again. If the problem
            persists, try refreshing the page.
          </p>
          {reset && (
            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchError({ reset }: ErrorFallbackProps) {
  return (
    <div role="alert" className="text-center p-6">
      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
      <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
        Search temporarily unavailable
      </h3>
      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
        We're having trouble with search right now. Please try again in a
        moment.
      </p>
      {reset && (
        <Button onClick={reset} variant="outline" size="sm">
          Try search again
        </Button>
      )}
    </div>
  );
}

export function NotFoundError() {
  return (
    <div role="alert" className="text-center p-8">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button asChild>
        <Link href="/">
          <Home className="h-4 w-4 mr-2" />
          Go home
        </Link>
      </Button>
    </div>
  );
}
