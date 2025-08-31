"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      aria-describedby={pending ? "loading-description" : undefined}
      {...props}
    >
      {pending && (
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
      {!pending && children}
    </Button>
  );
}
