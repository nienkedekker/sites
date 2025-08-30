"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} reset={this.resetErrorBoundary} />;
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error} 
          reset={this.resetErrorBoundary} 
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

function DefaultErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div 
      role="alert" 
      className="text-center p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Something went wrong
        </h2>
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">
          We encountered an unexpected error. This has been logged and we'll look into it.
        </p>
        <details className="text-left">
          <summary className="cursor-pointer text-red-700 dark:text-red-300 text-xs mb-2">
            Error details (click to expand)
          </summary>
          <pre className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded border overflow-auto">
            {error.message}
          </pre>
        </details>
      </div>
      <div className="flex gap-2 justify-center">
        <Button 
          onClick={reset}
          variant="outline"
          size="sm"
        >
          Try again
        </Button>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline" 
          size="sm"
        >
          Refresh page
        </Button>
      </div>
    </div>
  );
}