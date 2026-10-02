import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import markdownNegotiation from "./src/integrations/markdown-negotiation.ts";

export default defineConfig({
  site: "https://nienke.dev",
  adapter: vercel(),
  // The guestbook was retired; send old links home
  redirects: {
    "/guestbook": "/",
  },
  env: {
    schema: {
      // Upstash Redis (visitor counter), provisioned via Vercel
      KV_REST_API_URL: envField.string({ context: "server", access: "secret" }),
      KV_REST_API_TOKEN: envField.string({
        context: "server",
        access: "secret",
      }),
      // Read-only WaniKani personal access token, for the kanji card
      WANIKANI_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [react(), markdownNegotiation()],
});
