# api

The server: Cloudflare Pages Functions, with D1 through Drizzle. It answers the API, signs
people in and serves the themes' stylesheet; Pages serves the built client beside it.

## Layout

- `functions_src/`: the Functions, one for each address, built into `functions/`.
    - `trpc/[[trpc]].ts`: `/trpc`, the API.
    - `auth/[action].ts`: `/auth/…`, signing in and out (`docs/auth.md`).
    - `styles/sf-system.ts`: `/styles/sf-system`, the themes' stylesheet.
- `src/`: what the Functions use, built into `dist/`.
    - `routes/`: the tRPC routers. `appRouter.ts` is the API the client's types come from.
    - `domain/`: the theme system: themes, tokens, rules, the stylesheet and the seed.
    - `auth/`, `providers/`: signing in, and the provider (Zitadel).
    - `schemas/`: the tables; `db.ts`: the database (`docs/database.md`).
    - `config/`: tRPC and the settings; `lib/`: helpers the routes share.
- `migrations/`: generated from `src/schemas` (`docs/database.md`, "Migrations").
- `scripts/seed.mjs`: the seed's command.
- `default-pages/`, `sample-data/`: SQL run by hand with `wrangler d1 execute`, as each file
  says: the home page, and sample collections.
- `test/`: unit tests.
- `wrangler.toml`: the Pages project's settings (`docs/hosting.md`). Locally, wrangler keeps
  the database in `.wrangler/state`.

## Building and checking it

- The build compiles `src/` and `functions_src/` without type-checking them
  (`tsc --build --noCheck`); the Functions import what they use from `dist/`.
- Types: `tsconfig.check.json`, over both. The Functions' imports read `dist/`, so it needs a
  build first.

Running it and its checks, from the root: `README.md`, "Developing" and "Commands".

## Known issues

- A tRPC address with a broken escape (`/trpc/%E0%A4%A`) answers 500 and logs an error, though
  the mistake is the caller's: tRPC's `decodeURIComponent` throws.
