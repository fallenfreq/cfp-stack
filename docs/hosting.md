# Hosting

What runs the site outside this repo, in Cloudflare (checked in the dashboard, 2026-10-06).
Signing in's provider is in `docs/auth.md`, "Zitadel".

## The Pages project

- **Named `cfp-stack`**, built from GitHub's `fallenfreq/cfp-stack`. The `name` in
  `api/wrangler.toml` is `somefreq-pages`, not the project's, so a `wrangler pages` command that
  takes a project needs `--project-name cfp-stack`.
- **Build** (Settings, Build): the command `pnpm -w run build`, the root directory `api`, the
  output `client_dist`; the build cache is off. The build's Node is `NODE_VERSION` in
  `api/wrangler.toml`.
- **Deploying.** `main` is production, at somefreq.com: a push to it deploys, without waiting for
  GitHub's checks. Preview deployments are public by default.
- **From `api/wrangler.toml`:** the D1 binding, the variables and the runtime (compatibility date
  and flags). Secrets are kept in Cloudflare ("Settings").
- **Logs:** `wrangler pages deployment tail --project-name cfp-stack`, from `api/`, follows the
  Functions of production's latest deployment. Outside a terminal it needs a deployment's id
  (`wrangler pages deployment list --project-name cfp-stack`). `pnpm logging:api` names no
  project.

## D1

`somefreq-db`, bound as `DB`; its id is in `api/wrangler.toml`. Production and previews share it.
Its migrations and how they're applied: `docs/database.md`, "Migrations". Time Travel
(`wrangler d1 time-travel`) puts it back to an earlier moment.

## Settings

Variables are `api/wrangler.toml`'s `[vars]`, for production and previews alike. Secrets are set
in the dashboard or with `wrangler pages secret put NAME --project-name cfp-stack`, for
production only; previews have none. For development, `api/.dev.vars` (copied from
`api/.dev.vars.example`) holds both and overrides the variables.

| Setting                                                                                  | What it is                                                                                                                 |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OIDC_*`, `APP_ORIGINS`, `SESSION_SECRET*`, `ZITADEL_PROJECT_ID`, `DEV_INSECURE_COOKIES` | Signing in: `docs/auth.md`, "Settings"                                                                                     |
| `ZITADEL_CLIENT_ID`, `ZITADEL_CLIENT_SECRET`, `ZITADEL_INTROSPECTION_ENDPOINT`           | The old sign-in's, unused: `docs/auth.md`, "Zitadel"                                                                       |
| `GOOGLE_MAPS_API_KEY` (secret)                                                           | The map demo's key, given to signed-in users. Every tRPC and stylesheet request checks it's set (`api/src/config/envs.ts`) |
| `SMTP_OUT_SERVER`, `SMTP_OUT_PORT_TLS`, `SMTP_PASSWORD` (secret)                         | Mail through Zoho, for when the app sends email; nothing reads them yet                                                    |
| `NODE_VERSION`                                                                           | The build's Node                                                                                                           |

## Setting it up again

1. A D1 database (`wrangler d1 create`); its name and id go in `api/wrangler.toml`.
2. Zitadel (`docs/auth.md`, "Zitadel"); its ids and the site's address go in
   `api/wrangler.toml`'s `[vars]`.
3. A Pages project from the GitHub repository, with the build above, and the domain added. Named
   other than `cfp-stack`, the `--project-name` in these docs changes with it.
4. The secrets ("Settings").
5. The tables and the design: `pnpm migrate:push:api`, then `pnpm seed:live`.

## Known issues

- **A preview has no data and no styles.** Previews have no secrets, and every tRPC and
  stylesheet request checks `GOOGLE_MAPS_API_KEY` is set, so on a preview both should answer 500
  (read in the code, not tried on a preview). Nor can a preview sign in (`docs/auth.md`,
  "Settings").
