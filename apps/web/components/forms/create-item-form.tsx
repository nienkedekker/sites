import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createItemAction } from "@/app/actions";
import { SubmitButton } from "./submit-button";

export default function CreateItemForm() {
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Item</h1>

      <Tabs defaultValue="book" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="movie">Movie</TabsTrigger>
          <TabsTrigger value="show">TV Show</TabsTrigger>
        </TabsList>

        {/* Book Form */}
        <TabsContent value="book">
          <form className="space-y-4">
            <input type="hidden" name="itemtype" value="Book" />
            <Label>Title</Label>
            <Input type="text" name="title" required />

            <Label>Author</Label>
            <Input type="text" name="author" required />

            <Label>Published Year</Label>
            <Input type="number" name="publishedYear" required />

            <div className="flex items-center space-x-2">
              <Checkbox id="redo" name="redo" />
              <Label htmlFor="redo">This was a re-read</Label>
            </div>

            <SubmitButton formAction={createItemAction}>Save book</SubmitButton>
          </form>
        </TabsContent>

        {/* Movie Form */}
        <TabsContent value="movie">
          <form className="space-y-4">
            <input type="hidden" name="itemtype" value="Movie" />
            <Label>Title</Label>
            <Input type="text" name="title" required />

            <Label>Director</Label>
            <Input type="text" name="director" required />

            <Label>Release Year</Label>
            <Input type="number" name="publishedYear" required />

            <div className="flex items-center space-x-2">
              <Checkbox id="redo" name="redo" />
              <Label htmlFor="redo">This was a rewatch</Label>
            </div>

            <SubmitButton formAction={createItemAction}>
              Save movie
            </SubmitButton>
          </form>
        </TabsContent>

        {/* TV Show Form */}
        <TabsContent value="show">
          <form className="space-y-4">
            <input type="hidden" name="itemtype" value="Show" />
            <Label>Title</Label>
            <Input type="text" name="title" required />

            <Label>Season</Label>
            <Input type="number" name="season" required />

            <Label>Release Year</Label>
            <Input type="number" name="publishedYear" required />

            <div className="flex items-center space-x-2">
              <Checkbox id="redo" name="redo" />
              <Label htmlFor="redo">This was a rewatch</Label>
            </div>

            <SubmitButton formAction={createItemAction}>Save show</SubmitButton>
          </form>
        </TabsContent>
      </Tabs>
    </main>
  );
}
