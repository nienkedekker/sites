"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UpdateItemForm from "@/components/forms/update-item-form";
import type { Item } from "@/types";

const NOUN: Record<string, string> = {
  Book: "book",
  Movie: "movie",
  Show: "show",
};

interface EditItemDialogProps {
  item: Item;
  className?: string;
  onSaved?: () => void;
}

export default function EditItemDialog({
  item,
  className = "",
  onSaved,
}: EditItemDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSaved = () => {
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={`cursor-pointer ${className}`}>
          Edit
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {NOUN[item.itemtype] ?? "item"}</DialogTitle>
          <DialogDescription className="wrap-break-word">
            {item.title}
          </DialogDescription>
        </DialogHeader>
        <UpdateItemForm item={item} onSaved={handleSaved} />
      </DialogContent>
    </Dialog>
  );
}
