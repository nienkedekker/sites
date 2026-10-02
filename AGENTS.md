<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## Architecture Overview

Turbo monorepo with npm workspaces:

- `apps/web`: what.pm, the Next.js app described below
- `apps/site`: nienke.dev, an Astro site (imported with history via `git subtree`)
- `packages/ui` (`@nienke/ui`): the design system both share. It holds tokens,
  base styles, `.card`/`.display`/`.tag`, and motion in `styles.css`, plus React
  components (`card-head`, `media-chart`, `page-header`, `site-mark`). It's published as TypeScript source,
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

