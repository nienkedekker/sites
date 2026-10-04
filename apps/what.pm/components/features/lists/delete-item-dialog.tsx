"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import { deleteItemAction } from "@/app/actions/items";
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

export default function DeleteItemDialog({
  itemId,
  belongsToYear,
}: {
  itemId: string;
  belongsToYear: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    try {
      const result = await deleteItemAction(formData);
      setError(result.error);
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
          Delete
        </button>
      </DialogTrigger>
      <DialogContent aria-describedby="delete-description">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <p id="delete-description" className="text-ink-soft">
          This action cannot be undone. This will permanently delete the item.
        </p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <form action={handleSubmit}>
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="belongsToYear" value={belongsToYear} />
          <DialogFooter>
            <CancelButton onClick={() => handleOpenChange(false)} />
            <SubmitButton
              variant="destructive"
              pendingText="Deleting..."
              aria-describedby="delete-description"
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
