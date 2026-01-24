"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/utils/ui";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 rounded-md border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 outline-none transition-all duration-200 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-white dark:hover:bg-neutral-800 data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-neutral-100 data-[state=checked]:border-neutral-900 dark:data-[state=checked]:border-neutral-100 data-[state=checked]:text-white dark:data-[state=checked]:text-neutral-900 focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
