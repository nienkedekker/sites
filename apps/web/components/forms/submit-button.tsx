"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  isSubmitting?: boolean; // For React Hook Form compatibility
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  isSubmitting = false,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  // Use either native form pending state or RHF isSubmitting
  const isPending = pending || isSubmitting;

  return (
    <Button
      type="submit"
      disabled={isPending}
      aria-describedby={isPending ? "loading-description" : undefined}
      {...props}
    >
      {isPending && (
        <>
          <LoaderCircle
            className="animate-spin"
            width={16}
            height={16}
            aria-hidden="true"
          />
          <span className="ml-2">{pendingText}</span>
          <span id="loading-description" className="sr-only">
            Please wait while your request is being processed
          </span>
        </>
      )}
      {!isPending && children}
    </Button>
  );
}
