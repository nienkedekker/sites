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
          <form className="space-y-4" aria-labelledby="book-form-title">
            <h2 id="book-form-title" className="sr-only">
              Add new book
            </h2>
            <input type="hidden" name="itemtype" value="Book" />
            <div>
              <Label htmlFor="book-title">Title</Label>
              <Input
                type="text"
                id="book-title"
                name="title"
                required
                aria-describedby="book-title-error"
              />
            </div>

            <div>
              <Label htmlFor="book-author">Author</Label>
              <Input
                type="text"
                id="book-author"
                name="author"
                required
                aria-describedby="book-author-error"
              />
            </div>

            <div>
              <Label htmlFor="book-publishedYear">Published Year</Label>
              <Input
                type="number"
                id="book-publishedYear"
                name="publishedYear"
                required
                aria-describedby="book-year-error"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="book-redo" name="redo" />
              <Label htmlFor="book-redo">This was a re-read</Label>
            </div>

            <SubmitButton formAction={createItemAction}>Save book</SubmitButton>
          </form>
        </TabsContent>

        {/* Movie Form */}
        <TabsContent value="movie">
          <form className="space-y-4" aria-labelledby="movie-form-title">
            <h2 id="movie-form-title" className="sr-only">
              Add new movie
            </h2>
            <input type="hidden" name="itemtype" value="Movie" />
            <div>
              <Label htmlFor="movie-title">Title</Label>
              <Input
                type="text"
                id="movie-title"
                name="title"
                required
                aria-describedby="movie-title-error"
              />
            </div>

            <div>
              <Label htmlFor="movie-director">Director</Label>
              <Input
                type="text"
                id="movie-director"
                name="director"
                required
                aria-describedby="movie-director-error"
              />
            </div>

            <div>
              <Label htmlFor="movie-publishedYear">Release Year</Label>
              <Input
                type="number"
                id="movie-publishedYear"
                name="publishedYear"
                required
                aria-describedby="movie-year-error"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="movie-redo" name="redo" />
              <Label htmlFor="movie-redo">This was a rewatch</Label>
            </div>

            <SubmitButton formAction={createItemAction}>
              Save movie
            </SubmitButton>
          </form>
        </TabsContent>

        {/* TV Show Form */}
        <TabsContent value="show">
          <form className="space-y-4" aria-labelledby="show-form-title">
            <h2 id="show-form-title" className="sr-only">
              Add new TV show
            </h2>
            <input type="hidden" name="itemtype" value="Show" />
            <div>
              <Label htmlFor="show-title">Title</Label>
              <Input
                type="text"
                id="show-title"
                name="title"
                required
                aria-describedby="show-title-error"
              />
            </div>

            <div>
              <Label htmlFor="show-season">Season</Label>
              <Input
                type="number"
                id="show-season"
                name="season"
                required
                aria-describedby="show-season-error"
              />
            </div>

            <div>
              <Label htmlFor="show-publishedYear">Release Year</Label>
              <Input
                type="number"
                id="show-publishedYear"
                name="publishedYear"
                required
                aria-describedby="show-year-error"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="show-redo" name="redo" />
              <Label htmlFor="show-redo">This was a rewatch</Label>
            </div>

            <SubmitButton formAction={createItemAction}>Save show</SubmitButton>
          </form>
        </TabsContent>
      </Tabs>
    </main>
  );
}
