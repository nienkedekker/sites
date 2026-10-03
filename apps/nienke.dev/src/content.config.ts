import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const pages = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    lastUpdated: z.coerce.date().optional(),
  }),
});

export const collections = { pages };
