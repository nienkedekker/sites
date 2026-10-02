import * as React from "react";

import { cn } from "@/utils/ui";

// At least 16px, or iOS Safari zooms in on focus. The root size is 15px, so
// text-sm or text-base alone would be too small.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full border border-ink bg-panel px-3 py-2 text-[max(16px,1rem)] text-ink transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-faint aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
