import { LoaderCircle } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 16, className }: LoadingSpinnerProps) {
  return (
    <LoaderCircle
      className={`animate-spin ${className || ""}`}
      width={size}
      height={size}
      aria-hidden="true"
    />
  );
}
