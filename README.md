# cfp-stack

My personal website, somefreq.com, and the system it runs on: pages written in a block editor and
styled by themes kept in the database. It runs on Cloudflare Pages, and began as a rework of
[mystack](https://github.com/fallenfreq/mystack).

- **`client/`**: the site and its editor, in Vue 3 and Vite (`client/README.md`).
- **`api/`**: the API, signing in and the themes' stylesheet, as Cloudflare Pages Functions, with
  tRPC, Drizzle and D1 (`api/README.md`).
- **`shared/`**: code both use as it is (`shared/README.md`).
- **`docs/`**: how things work, and where to find the rest (`docs/README.md`).

## Setting it up

1. Node 24, and pnpm through Corepack: `corepack enable` (the version is `packageManager` in
   `package.json`), then `pnpm install`.
2. The settings: `cp api/.dev.vars.example api/.dev.vars`, then fill it in. Without them the site
   loads, but signing in and the signed-in API fail. What each one is: `docs/hosting.md`,
   "Settings".
3. Signing in needs a Zitadel project for development: `docs/auth.md`, "Zitadel".
4. The local database: `pnpm migrate:push:local:api` creates it and applies the migrations,
   and `pnpm seed:local` puts in the design (themes, rules) and the
   collections the menu links to. Without the seed the site has no styles. After a change to
   `api/src/schemas`: `docs/database.md`, "Migrations".

Hosting it: `docs/hosting.md`.

## Developing

`pnpm dev` builds the client and the API as you edit, and serves the whole site at
http://localhost:8788. For hot reload as well, `pnpm dev:vite:client` serves the client at
http://localhost:5173 and passes `/trpc`, `/auth/` and `/styles` to 8788. `pnpm dev:api` serves
the API with the client as last built.

## Commands

| Command                       | What it does                                                            |
| ----------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`                    | Build the client and API as you edit; serve the site at 8788            |
| `pnpm dev:vite:client`        | Vite at 5173, with hot reload, passing API calls to 8788                |
| `pnpm build`                  | Build client + API side by side, no type check. Cloudflare's build      |
| `pnpm typecheck`              | Type-check staged packages (`--all`: every package). Pre-commit runs it |
| `pnpm test`                   | Unit tests (`test`, `api/test`; Node's built-in runner)                 |
| `pnpm test:ui`                | Layout checks in Chrome (`client/e2e`, Playwright)                      |
| `pnpm preview:components`     | Build the component preview (`--serve`: at http://localhost:4173)       |
| `pnpm migrate:api`            | Generate Drizzle migration files                                        |
| `pnpm migrate:push:local:api` | Apply migrations to local D1                                            |
| `pnpm migrate:push:api`       | Apply migrations to production D1                                       |
| `pnpm seed:local`             | Replace local D1's design with the seed's; add missing menu collections |
| `pnpm seed:live`              | The same for production D1: says what it replaces and asks first        |
| `pnpm lint`                   | ESLint with auto-fix                                                    |
| `pnpm format`                 | Prettier                                                                |

## Checks

Checks run at two points. On commit, the hook lints and formats the staged files and
type-checks the packages they touch. On every push to `main` and every pull request, GitHub
Actions (`.github/workflows/checks.yml`) lints and checks formatting across the repo, then
builds, type-checks every package and runs the unit tests.

## Deploying

A push to `main` deploys it: `docs/hosting.md`, "The Pages project".

## The theme system

`sf-` classes say what something is (a card, a tag, a loud button) and the active theme decides
how it looks; `sl-` classes arrange things. Themes live in D1, seeded from
`api/src/domain/seed.ts`, and are served as one stylesheet at `/styles/sf-system`. The spec is
`client/src/assets/sf-system.md`. There's a dark theme, a light one and a pink one, which
Ctrl+Shift+K turns on and off.
