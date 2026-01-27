"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

type Props = ComponentProps<typeof Button> & {
  /** Text to display while form is submitting */
  pendingText?: string;
  /** For React Hook Form compatibility - combines with native form pending state */
  isSubmitting?: boolean;
};

/**
 * Submit button that shows loading state during form submission.
 * Works with both native form actions and React Hook Form.
 */
export function SubmitButton({
  children,
  pendingText = "Submitting...",
  isSubmitting = false,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  // Combine native form pending state with RHF isSubmitting
  const isPending = pending || isSubmitting;

  return (
    <Button
      type="submit"
      disabled={isPending}
      aria-busy={isPending}
      aria-label={isPending ? pendingText : undefined}
      {...props}
    >
      {isPending ? (
        <>
          <LoaderCircle
            className="animate-spin"
            width={16}
            height={16}
            aria-hidden="true"
          />
          <span className="ml-2">{pendingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
