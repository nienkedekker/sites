## Architecture Overview

Turbo monorepo with npm workspaces:

- `apps/web`: what.pm, the Next.js app described below
- `apps/site`: nienke.dev, an Astro site (imported with history via `git subtree`)
- `packages/ui` (`@nienke/ui`): the design system both share. It holds tokens,
  base styles, `.card`/`.display`/`.tag`, and motion in `styles.css`, plus React
  components (`media-chart`, `site-mark`). It's published as TypeScript source,
  with no build step. Change the look here, not in either app.

what.pm is a Next.js 15 app with:

- Turbo monorepo setup
- Next.js App Router
- Supabase for backend/database
- Tailwind CSS 4 + Radix UI components, styled with `@nienke/ui` tokens (`ink`, `paper`, `line`, …)
- TypeScript support
- Server Actions for form handling

## TODO
- Fix pending states when submitting forms
- Add JSDoc comments for complex functions
- Add API documentation
- Reading/watching patterns analysis?

