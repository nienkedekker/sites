"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  isSubmitting?: boolean;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  isSubmitting = false,
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  const isPending = pending || isSubmitting;

  return (
    <Button
      type="submit"
      {...props}
      disabled={isPending || disabled}
      aria-busy={isPending}
      aria-label={isPending ? pendingText : props["aria-label"]}
    >
      {isPending ? (
        <>
          <LoadingSpinner />
          <span>{pendingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
