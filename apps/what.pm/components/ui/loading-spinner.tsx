import { CircleNotch } from "@phosphor-icons/react/ssr";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 16, className }: LoadingSpinnerProps) {
  return (
    <CircleNotch
      className={`animate-spin ${className || ""}`}
      size={size}
      aria-hidden="true"
    />
  );
}
