# cfp-stack

pnpm monorepo running on Cloudflare Pages. Vue 3 + Vite frontend (`client/`), Cloudflare Pages Functions backend (`api/`), code both use as is with no build (`shared/`), tRPC for the API layer, Drizzle ORM with Cloudflare D1 (SQLite), Zitadel for auth.

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

`api/.dev.vars` holds dev settings and secrets (the dev Zitadel app's id and secret, the session secret, SMTP password, Google Maps key). Without these, the app loads but signing in and protected tRPC routes fail. The live non-secret settings (`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `APP_ORIGINS`, `ZITADEL_PROJECT_ID`) are in `api/wrangler.toml`. The client has no settings of its own.

### 3. Local D1 database

```bash
pnpm migrate:push:local:api
pnpm seed:local
```

The first creates `.wrangler/state/v3/d1/` (local SQLite) and applies all migrations. Re-run whenever `api/src/schemas` changes. The second puts the design (themes, rules) in, and the collections the menu links to if they're missing; without it the site has no styles.

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
| `pnpm build`                  | Build client + API side by side, no type check. Cloudflare's build      |
| `pnpm typecheck`              | Type-check staged packages (`--all`: every package). Pre-commit runs it |
| `pnpm test`                   | Unit tests (`test`, `api/test`; Node's built-in runner)                 |
| `pnpm test:ui`                | Layout checks in Chrome (`client/e2e`, Playwright)                      |
| `pnpm migrate:api`            | Generate Drizzle migration files                                        |
| `pnpm migrate:push:local:api` | Apply migrations to local D1                                            |
| `pnpm migrate:push:api`       | Apply migrations to production D1                                       |
| `pnpm seed:local`             | Replace local D1's design with the seed's; add missing menu collections |
| `pnpm seed:live`              | The same for production D1: says what it replaces and asks first        |
| `pnpm lint`                   | ESLint with auto-fix                                                    |
| `pnpm format`                 | Prettier                                                                |

Checks run at two points. On commit, the hook lints and formats the staged files and
type-checks the packages they touch. On every push to `main` and every pull request, GitHub
Actions (`.github/workflows/checks.yml`) lints and checks formatting across the repo, then
builds, type-checks every package and runs the unit tests. Cloudflare only builds: it
deploys `main` on its own, without waiting for the checks.

## Auth setup (Zitadel)

Our server signs you in and keeps the session; the browser only gets our cookie (design and
progress: `docs/auth.md`). Requires a [Zitadel](https://zitadel.com/) instance with a project per
environment (dev, prod), each with a **Web app**: Code flow, Basic client secret, Authorization
Code + Refresh Token grants.

- Redirect URI `/auth/callback`, post-logout URI `/`. Dev: on both ports (`http://localhost:8788`,
  `http://localhost:5173`), with development mode on (plain http).
- Dev: the app's client id and secret and the project id go in `api/.dev.vars` (`OIDC_CLIENT_ID`,
  `OIDC_CLIENT_SECRET`, `ZITADEL_PROJECT_ID`), with a `SESSION_SECRET` of 32 random bytes
  (`openssl rand -base64 32`).
- Prod: the client id and project id are in `api/wrangler.toml`; `OIDC_CLIENT_SECRET` and
  `SESSION_SECRET` are Production secrets.
- Each project also has the old sign-in's User Agent and API apps, and its `ZITADEL_CLIENT_ID`,
  `ZITADEL_CLIENT_SECRET` and `ZITADEL_INTROSPECTION_ENDPOINT` remain: unused, kept so an older
  version can still run (`docs/auth.md`, "Zitadel").

Production secrets go in the Cloudflare dashboard or via `wrangler pages secret put SECRET_NAME
--project-name cfp-stack` (the Pages project's name, not the one in `wrangler.toml`).

## Migration order

Schema changes require:

```bash
pnpm migrate:api                # generate the migration from api/src/schemas
pnpm migrate:push:local:api     # apply to local D1, after reading it (docs/database.md)
```

## Deployment

Push to `main` — Cloudflare Pages deploys automatically via GitHub integration.

## Working method (sf/sl theme system)

The theme system's spec is `client/src/assets/sf-system.md`; open work and where to resume is
`client/src/assets/sf-system-todo.md`, "Current state (resume here)".

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
- Bumping `api/src/domain/seedVersion.ts` needs a reseed (`pnpm seed:local`; `pnpm seed:live`
  after the change is deployed: live builds the stylesheet with its own code).
