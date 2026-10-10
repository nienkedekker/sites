"use client";
import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";

// Every delete asks here first: one item in the lists, or a selection on the
// up next and recs pages. It closes once the action comes back without an error
export function ConfirmDeleteDialog({
  label = "Delete",
  description,
  action,
  fields = {},
  onDeleted,
}: {
  label?: string;
  description: string;
  action: (formData: FormData) => Promise<{ error: string | null }>;
  fields?: Record<string, string | number>;
  onDeleted?: () => void;
}) {
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    try {
      const result = await action(formData);
      setError(result.error);
      if (!result.error) {
        setOpen(false);
        onDeleted?.();
      }
    } catch (err) {
      unstable_rethrow(err);
      setError(
        "Couldn’t reach the server. Check your connection and try again.",
      );
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer underline decoration-line-strong underline-offset-4 transition-colors hover:text-danger hover:decoration-danger"
        >
          {label}
        </button>
      </DialogTrigger>
      <DialogContent aria-describedby={descriptionId}>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <p id={descriptionId} className="text-ink-soft">
          {description}
        </p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <form action={handleSubmit}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <DialogFooter>
            <CancelButton onClick={() => handleOpenChange(false)} />
            <SubmitButton
              variant="destructive"
              pendingText="Deleting..."
              aria-describedby={descriptionId}
            >
              Confirm
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={pending}
    >
      Cancel
    </Button>
  );
}
