"use client";
import { useState } from "react";
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

  const handleSubmit = async (formData: FormData) => {
    await deleteItemAction(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action={handleSubmit}>
            <input type="hidden" name="id" value={itemId} />
            <input type="hidden" name="belongsToYear" value={belongsToYear} />
            <SubmitButton
              variant="destructive"
              pendingText="Deleting..."
              aria-describedby="delete-description"
            >
              Confirm
            </SubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
