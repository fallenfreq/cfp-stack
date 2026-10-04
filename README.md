# Tech Stack Monorepo

## Overview

This is my personal website, which is a refactored version of [/mystack](https://github.com/fallenfreq/mystack) to run on Cloudflare Pages. Zitadel's free plan is now being utilised instead of self-hosting, and Drizzle is still being utilised as an ORM; however, with Cloudflare's D1 serverless database.

It includes:

- **TypeScript**
- **Vite**
- **Vue 3**
- **sf/sl design system** (own theme system, served from D1)
- **Drizzle ORM**
- **tRPC**
- **Zitadel**

## Setup

### Prerequisite

You'll need a GitHub account and a Cloudflare account, which can be on the free tier. Go to `https://dash.cloudflare.com/`, select `workers & pages`, then click `Create`. Select the `Pages` tab and click `Connect to git`. More information on Git integration can be found [here](https://developers.cloudflare.com/pages/configuration/git-integration/). There are plenty of tutorials online for setting up Cloudflare pages, your domain name, GitHub, etc., so this document doesn't go into too much detail in that regard.

### Environment Variables

Create a copy of `api/.dev.vars.example` with the `.example` removed and fill in appropriately to set Pages development variables. Production environment variables are set in the `api/wrangler.toml` file. Secrets should be set via the Cloudflare dashboard or via `wrangler pages secret put API_KEY`. More information can be found below:

- [Wrangler config](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/#pages)
- [Binding secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets)

### Authentication

Signing in runs through our own server: it signs you in with Zitadel, keeps Zitadel's tokens itself and gives the browser only its own cookie, so every tab is signed in. The design is in `docs/auth.md`. The stack uses the free tier of the managed service from [Zitadel](https://zitadel.com/), though you can choose to self-host, with a reference for that [here](https://github.com/fallenfreq/mystack). You'll need to create a Zitadel account, an instance, and a user for the instance; instructions for this can be found elsewhere.

#### Create the Web App

- Go to your specific instance URL `https://somefreq-instance.zitadel.cloud`.
- Create a production project and save its Resource ID as `ZITADEL_PROJECT_ID` in `api/wrangler.toml`.
- Add a new application, select Web, then Code with a Basic client secret, and allow the Authorization Code and Refresh Token grants.
- Add `https://some-domain/auth/callback` as a redirect URI and `https://some-domain/` as a Post Logout URI, using the domain used for your Cloudflare page.
- Save the Client ID as `OIDC_CLIENT_ID` and the site's address (`https://some-domain`) as `APP_ORIGINS` in `api/wrangler.toml`.
- Save the client secret as `OIDC_CLIENT_SECRET`, and 32 random bytes (`openssl rand -base64 32`) as `SESSION_SECRET`, to the Cloudflare dashboard or via the `wrangler pages secret put API_KEY` command mentioned in the Environment Variables section above.
- In the instance's settings, set the refresh token lifetimes to 30 days, how long a session lasts.

##### For development

Create a development project and follow the same instructions again, only this time using local addresses, and add the variables, including secrets, to `api/.dev.vars` instead. You'll need both the Wrangler dev port `8788` and the Vite dev port `5173`: `http://localhost:8788/auth/callback` and `http://localhost:5173/auth/callback` as redirect URIs, and `http://localhost:8788/` and `http://localhost:5173/` as Post Logout URIs. The dev mode switch will need checking if using HTTP locally.

### Database

Configure the D1 database via the `api/wrangler.toml` file under `[[d1_databases]]`. Create a D1 database by going to `https://dash.cloudflare.com/`, selecting Workers & Pages > D1 SQL Database, and clicking `+create`. Then add the database name and ID to `api/wrangler.toml`. Once you have a database, run `pnpm migrate:api` to generate the migrate files and `pnpm migrate:push:api` to push them to the database. Use `pnpm migrate:push:local:api` to push to a local copy of the database for development. You'll also need to do this when you change the `api/src/schemas` files. Then run `pnpm seed:local` (`pnpm seed:live` for production) to put in the design system and the collections the menu links to; without it the site has no styles.

## Development Commands

PNPM is used to make this a monorepo with PNPM workspaces. Corepack is required for the `packageManager` field in the `package.json` to be acknowledged. It may or may not have been included with your install of Node.js. Corepack also needs enabling by running `corepack enable`.

More information can be found on Corepack [here](https://nodejs.org/api/corepack.html).

- **Install Dependencies:** `pnpm install`
- **Build API and Client:** `pnpm build`
- **Generate migrate files:** `pnpm migrate:api`
- **Push generated migrate files to the production database:** `pnpm migrate:push:api`
- **Push generated migrate files to the development database:** `pnpm migrate:push:local:api`
- **Seed the design system (themes, rules) and the menu's collections into the development database:** `pnpm seed:local`
- **Seed the design system and the menu's collections into the production database:** `pnpm seed:live`
- **Start Wrangler pages dev server:** `pnpm dev`
- **Start Vite Dev Server for front end HMR:** `pnpm dev:vite:client`

## Deployment

Simply push your changes to GitHub to have your project automatically publish to Cloudflare Pages.

### Ports

- Wrangler pages dev server: `8788`
- Vite Dev Server: `5173`

### tRPC Endpoints

The tRPC API endpoints are prefixed with `/trpc`. Unprefixed URLs will serve the client and client assets. There is, however, no need to visit tRPC endpoints manually since you make queries using tRPC instead of something like Axios.

```typescript
trpc.secure.test
	.query('Sending data to tRPC secure endpoint from Vue client')
	.then((response) => {
		console.log('tRPC secure response', response)
	})
	.catch((error) => {
		console.log(error)
	})
```

## Styling

Styling comes from the sf/sl design system: `sf-` classes say what something is (a card, a tag, a loud button) and the active theme decides how it looks; `sl-` classes arrange things. Themes, tokens and rules live in D1, seeded from `api/src/domain/seed.ts`, and are served as one stylesheet at `/styles/sf-system`. The spec is `client/src/assets/sf-system.md`. Components wrap their own CSS in `@layer ui` so every theme class wins over it.

### Themes

There's currently a dark mode, light mode, and secret pink mode. Press `ctr+shift+k` to toggle pink mode. The secret pink mode was just to test if more than two themes could be implemented efficiently with the current configuration without changing the dark mode switch, which starts based on OS preference.

## Contributions

We welcome contributions! Please feel free to fork this repository, submit pull requests, make feature requests, report bugs, or ask questions.
