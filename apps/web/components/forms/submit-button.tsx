"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  isSubmitting?: boolean;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  isSubmitting = false,
  ...props
}: Props) {
  const { pending } = useFormStatus();

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
          <span>{pendingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
