"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
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

export default function DeleteItemDialog({
  itemId,
  belongsToYear,
}: {
  itemId: string;
  belongsToYear: number;
}) {
  const [open, setOpen] = useState(false);
  const { pending } = useFormStatus();

  const handleSubmit = async (formData: FormData) => {
    await deleteItemAction(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-xs p-0 cursor-pointer">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="delete-description">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <p id="delete-description" className="text-sm text-gray-600">
          This action cannot be undone. This will permanently delete the item.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action={handleSubmit}>
            <input type="hidden" name="id" value={itemId} />
            <input type="hidden" name="belongsToYear" value={belongsToYear} />
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              aria-describedby="delete-description"
            >
              {pending ? "Deleting..." : "Confirm"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
