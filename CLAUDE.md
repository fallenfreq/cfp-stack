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

| Script | What it does |
|---|---|
| `pnpm dev` | Start both servers |
| `pnpm build` | Build client + API |
| `pnpm migrate:api` | Generate Drizzle migration files |
| `pnpm migrate:push:local:api` | Apply migrations to local D1 |
| `pnpm migrate:push:api` | Apply migrations to production D1 |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm format` | Prettier |

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
