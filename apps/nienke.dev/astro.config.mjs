import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import markdownNegotiation from "./src/integrations/markdown-negotiation.ts";

export default defineConfig({
  site: "https://nienke.dev",
  adapter: vercel(),
  redirects: {
    "/guestbook": "/",
  },
  env: {
    schema: {
      KV_REST_API_URL: envField.string({ context: "server", access: "secret" }),
      KV_REST_API_TOKEN: envField.string({
        context: "server",
        access: "secret",
      }),
      WANIKANI_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // The /nanami status page: my password, and the token nanami pushes with
      NANAMI_PASSWORD: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      NANAMI_PUSH_TOKEN: envField.string({
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
  vite: {
    plugins: [tailwindcss()],
  },
});
