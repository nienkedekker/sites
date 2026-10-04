<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## Architecture Overview

Turbo monorepo with npm workspaces:

- `apps/what.pm`: what.pm, the Next.js app (Supabase backend)
- `apps/nienke.dev`: nienke.dev, an Astro site (imported with history via `git subtree`)
- `packages/ui` (`@nienke/ui`): the design system both share. `styles.css` holds
  tokens, base styles, `.card`/`.display`/`.tag` and motion; `src/` holds the
  shared React components (headers, cards, charts, stats, nav, footer) and
  helpers such as the number and date formatters (`format`), each exported by
  path in `package.json`. It's published as TypeScript source, with no build
  step. Change the look here, not in either app.

## TODO
- Fix pending states when submitting forms
- Add JSDoc comments for complex functions
- Add API documentation
- Reading/watching patterns analysis?

