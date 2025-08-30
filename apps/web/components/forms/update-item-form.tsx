import { updateItemAction } from "@/app/actions/items";
import { SubmitButton } from "./submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Item } from "@/types";

interface UpdateItemFormProps {
  item: Item;
}

export default async function UpdateItemForm({ item }: UpdateItemFormProps) {
  return (
    <form action={updateItemAction} className="space-y-4">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="itemtype" value={item.itemtype} />

      <Label>Title</Label>
      <Input type="text" name="title" defaultValue={item.title} required />

      {item.itemtype === "Book" && (
        <>
          <Label>Author</Label>
          <Input
            type="text"
            name="author"
            defaultValue={item.author ?? ""}
            required
          />
        </>
      )}

      {item.itemtype === "Movie" && (
        <>
          <Label>Director</Label>
          <Input
            type="text"
            name="director"
            defaultValue={item.director ?? ""}
            required
          />
        </>
      )}

      {item.itemtype === "Show" && (
        <>
          <Label>Season</Label>
          <Input
            type="number"
            name="season"
            defaultValue={item.season ?? ""}
            required
          />
        </>
      )}

      <Label>Published Year</Label>
      <Input
        type="number"
        name="publishedYear"
        defaultValue={item.published_year}
        required
      />

      <Label>Belongs To Year</Label>
      <Input
        type="number"
        name="belongsToYear"
        defaultValue={item.belongs_to_year}
        required
      />

      <div className="flex items-center space-x-2">
        <Checkbox id="redo" name="redo" defaultChecked={item.redo ?? false} />
        <Label htmlFor="redo">Redo?</Label>
      </div>

      <SubmitButton>Update Item</SubmitButton>
    </form>
  );
}
