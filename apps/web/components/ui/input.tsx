import * as React from "react";

import { cn } from "@/utils/ui";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg border-2 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 focus-visible:bg-white dark:focus-visible:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
