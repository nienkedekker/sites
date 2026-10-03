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
