# cfp-stack

pnpm monorepo running on Cloudflare Pages. Vue 3 + Vite frontend (`client/`), Cloudflare Pages Functions backend (`api/`), tRPC for the API layer, Drizzle ORM with Cloudflare D1 (SQLite), Zitadel for auth.

## First-time setup

### 1. Dependencies

```bash
pnpm install
```

### 2. Environment files

Copy the example and fill in credentials when available:

```bash
cp api/.dev.vars.example api/.dev.vars
```

`api/.dev.vars` holds dev secrets (Zitadel client secret, SMTP password, Google Maps key). Without these, the app loads but auth and protected tRPC routes fail. The non-secret vars (`ZITADEL_CLIENT_ID`, `ZITADEL_INTROSPECTION_ENDPOINT`) are already set in `api/wrangler.toml`.

`client/.env.development` is already configured for local dev (points to `localhost:8788`).

### 3. Local D1 database

```bash
pnpm migrate:push:local:api
```

Creates `.wrangler/state/v3/d1/` (local SQLite) and applies all migrations. Re-run whenever `api/src/schemas` changes.

## Development

```bash
pnpm dev                 # both servers in parallel
# or separately:
pnpm dev:api             # wrangler pages dev → http://localhost:8788
pnpm dev:vite:client     # vite HMR → http://localhost:5173
```

The full-stack experience runs at **8788** (wrangler serves both the API and the built client). Port **5173** is for Vite HMR during frontend work — it proxies API calls to 8788.

## Key scripts

| Script                        | What it does                                                            |
| ----------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`                    | Start both servers                                                      |
| `pnpm build`                  | Build client + API                                                      |
| `pnpm typecheck`              | Type-check staged packages (`--all`: every package). Pre-commit runs it |
| `pnpm test`                   | Unit tests (`api/test`, Node's built-in runner)                         |
| `pnpm test:ui`                | Layout checks in Chrome (`client/e2e`, Playwright)                      |
| `pnpm migrate:api`            | Generate Drizzle migration files                                        |
| `pnpm migrate:push:local:api` | Apply migrations to local D1                                            |
| `pnpm migrate:push:api`       | Apply migrations to production D1                                       |
| `pnpm lint`                   | ESLint with auto-fix                                                    |
| `pnpm format`                 | Prettier                                                                |

## Auth setup (Zitadel)

Requires a [Zitadel](https://zitadel.com/) instance. Two apps per environment (dev/prod):

- **User Agent app (PKCE)** — for the Vue frontend login flow. Client ID → `VITE_API_ZITADEL_CLIENT_ID` in `client/.env.development`.
- **API app (Basic)** — for token introspection. Client ID + secret → `api/.dev.vars`.

Redirect URIs for dev: `http://localhost:5173/auth/signinwin/zitadel` and `http://localhost:8788/auth/signinwin/zitadel`.

Production secrets go in the Cloudflare dashboard or via `wrangler pages secret put SECRET_NAME`.

## Migration order

Schema changes require:

```bash
pnpm build:api                  # drizzle reads from dist/schemas/*.js
pnpm migrate:api                # generate SQL migration files
pnpm migrate:push:local:api     # apply to local D1
```

## Deployment

Push to `main` — Cloudflare Pages deploys automatically via GitHub integration.

## Working method (sf/sl theme system)

The theme system's spec is `client/src/assets/sf-system.md`; open work and where to resume is
`client/src/assets/sf-system-todo.md` ("Current state (resume here)").

- One file at a time: reason → sign-off → edit. Simple, behaviour-neutral files may be
  batched with one review at the end.
- Classes (and comments) state meaning; the theme decides the look. Plain user terms.
- Flag new vocabulary for approval: classes, tokens, component names, props, services.
- Theme creators and content creators must not need to know about each other.
- Verify every review finding in code; fix it in the layer that owns it. A finding outside
  the approved scope is logged and raised, not fixed inline — say which findings are
  regressions from the current change and which predate it.
- Never loosen validators or system limits without approval. Ask before undoing work.
- Don't auto-run lint or build; typechecks are fine:
  `cd client && ./node_modules/.bin/vue-tsc --noEmit -p tsconfig.app.json`,
  `cd api && ../node_modules/.bin/tsc --noEmit -p tsconfig.src.json` (and
  `tsconfig.functions.json`; `tsc -p .` checks nothing).
- Component preview: `node --no-warnings client/preview/build.mjs` (`--serve` → :4173).
- Layout checks: `pnpm test:ui` runs `client/e2e` in the installed Chrome against the dev
  server (8788, started if needed), with a stylesheet built from the seed in memory. Each runs
  under the root theme and a deliberately different test theme (`e2e/testTheme.ts`, never
  seeded), so checks state behaviour, not looks or pixels. The cases are on
  `/editor?seed=tests`; add one for each layout fix. The demo-page snapshot fails on any move;
  accept an intended one with `pnpm test:ui --update-snapshots`. `SF_SYSTEM_CSS=<file>` checks
  another stylesheet. Known limits are checks marked expected to fail (`e2e/known.spec.ts`).
  After editing client code, let the dev build finish first: a page loaded mid-rebuild times
  out.
- Commit only when asked. Browser floor is Safari 17.4 (themes are emitted in `@scope`); no
  compat code below it.
- Bumping `api/src/domain/seedVersion.ts` needs a reseed (`pnpm seed:local`).
