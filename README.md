# Tech Stack Monorepo

## Overview

This is my personal website, which is a refactored version of [/mystack](https://github.com/fallenfreq/mystack) to run on Cloudflare Pages. Zitadel's free plan is now being utilised instead of self-hosting, and Drizzle is still being utilised as an ORM; however, with Cloudflare's D1 serverless database.

It includes:

- **TypeScript**
- **Vite**
- **Vue 3**
- **Vuestic UI**
- **PrimeVue (unstyled with Tailwind)**
- **Tailwind CSS**
- **Drizzle ORM**
- **tRPC**
- **Zitadel**

## Setup

### Prerequisite

You'll need a GitHub account and a Cloudflare account, which can be on the free tier. Go to `https://dash.cloudflare.com/`, select `workers & pages`, then click `Create`. Select the `Pages` tab and click `Connect to git`. More information on Git integration can be found [here](https://developers.cloudflare.com/pages/configuration/git-integration/). There are plenty of tutorials online for setting up Cloudflare pages, your domain name, GitHub, etc., so this document doesn't go into too much detail in that regard.

### Environment Variables

Create a copy of `api/.dev.vars.example` with the `.example` removed and fill in appropriately to set Pages development variables. Production environment variables are set in the `api/wrangler.toml` file. Secrets should be set via the Cloudflare dashboard or via `wrangler pages secret put API_KEY`. `client/.env` is public, so don't add secrets to it. More information can be found below:

- [Wrangler config](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/#pages)
- [Binding secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets)

### Authentication

Zitadel needs to be running for the login button to work. You'll also need to log in to the Zitadel console, create a Vue app to log into, create an API app for the API to do token inspection, and add the appropriate `.env` vars to the client and API `.env` files. The stack uses the free tier of the managed service from [Zitadel](https://zitadel.com/), though you can choose to self-host, with a reference for that [here](https://github.com/fallenfreq/mystack). You'll need to create a Zitadel account, an instance, and a user for the instance; instructions for this can be found elsewhere.

#### Create Login App

- Go to your specific instance URL `https://somefreq-instance.zitadel.cloud`.
- Create a production project and save the Resource ID as `VITE_API_ZITADEL_PROJECT_RESOURCE_ID` in the client `.env` file.
- Add a new application, select User Agent, then PKCE for an SPA.
- Add `https://some-domain/auth/signinwin/zitadel` as a redirect URI, using the domain used for your Cloudflare page.
- Add `https://some-domain` as a Post Logout URI, using the domain used for your Cloudflare page.
- Save the Client ID as `VITE_API_ZITADEL_CLIENT_ID` in the client `.env` file.

##### For development

Create a development project and follow the same instructions again, only this time using local domains for the redirects. Currently, the production or development vars need to be commented out or in depending on your working environment. You'll need to add multiple domains if you'd like the redirects to work with both the Vite dev port `5173` and the Wrangler dev port `8788`. For example, `http://localhost:5173/auth/signinwin/zitadel` and `http://localhost:8788/auth/signinwin/zitadel`. The dev mode switch will need checking if using HTTP locally.

#### Create Token Inspection App

- Go to your specific instance URL `https://somefreq-instance.zitadel.cloud`.
- Go to your previously created project.
- Add a new application, select API, then Basic for the tRPC API.
- Save the client ID as `ZITADEL_CLIENT_ID` to the `api/wrangler.toml` file and the client secret as `ZITADEL_CLIENT_SECRET` to the Cloudflare dashboard or via the `wrangler pages secret put API_KEY` command mentioned in the Environment Variables section above.

##### For development

Go back to your development project and follow the same instructions again, adding the variables, including secrets, to `api/.dev.vars` instead.

##### More info

- You can see more information on how to log in to a single-page application with Zitadel [here](https://zitadel.com/docs/examples/login/vue).

- You can see more information on how we secure the API routes with Zitadel via token inspection and how to set up the API app in Zitadel [here](https://zitadel.com/blog/testing-token-introspection-with-postman).

### Database

Configure the D1 database via the `api/wrangler.toml` file under `[[d1_databases]]`. Create a D1 database by going to `https://dash.cloudflare.com/`, selecting Workers & Pages > D1 SQL Database, and clicking `+create`. Then add the database name and ID to `api/wrangler.toml`. Once you have a database, run `pnpm migrate:api` to generate the migrate files and `pnpm migrate:push:api` to push them to the database. Use `pnpm migrate:push:local:api` to push to a local copy of the database for development. You'll also need to do this when you change the `api/src/schemas` files.

## Development Commands

PNPM is used to make this a monorepo with PNPM workspaces. Corepack is required for the `packageManager` field in the `package.json` to be acknowledged. It may or may not have been included with your install of Node.js. Corepack also needs enabling by running `corepack enable`.

More information can be found on Corepack [here](https://nodejs.org/api/corepack.html).

- **Install Dependencies:** `pnpm install`
- **Build API and Client:** `pnpm build`
- **Generate migrate files:** `pnpm migrate:api`
- **Push generated migrate files to the production database:** `pnpm migrate:push:api`
- **Push generated migrate files to the development database:** `pnpm migrate:push:local:api`
- **Start API (Wrangler pages dev server) and Vite Dev Server:** `pnpm dev`

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

The framework currently has the option to use Vuestic and PrimeVue components. You can customise the colours for both by editing the variables at `client/src/assets/base.css`.

### Tailwind and Vuestic

We are currently favouring Vuestic to PrimeVue.

Read more about integrating Tailwind with Vuestic [here](https://ui.vuestic.dev/styles/tailwind).

The `client/cssVariables.js` file is generated by `client/plugins/extractCssVars.ts` so that variables can be accessed and passed to `vuestic.my.config.ts` to avoid duplicating colour definitions. We are using `vuestic.my.config.ts` instead of `vuestic.config.js` because Vuestic has commands such as `npx sync-tailwind-with-vuestic` that can generate the `vuestic.config.js` file and would therefore overwrite our bespoke one.

### Tailwind and PrimeVue

PrimeVue components are unstyled (this is what PrimeVue calls it when the styling is done via the `pt` property) and styled with Tailwind. We cannot use `tailwindcss-primeui` until PrimeVue v4 supports Tailwind presets.

- [Tailwind CSS PrimeUI](https://github.com/primefaces/tailwindcss-primeui)
- [PrimeVue Tailwind](https://primevue.org/tailwind/)

Set a PrimeVue Tailwind theme by downloading your required components in your chosen theme from [here](https://tailwind.primevue.org/builder/) and adding them to `client/src/presets`.

### Themes

There's currently a dark mode, light mode, and secret pink mode. Press `ctr+shift+k` to toggle pink mode. The secret pink mode was just to test if more than two themes could be implemented efficiently with the current configuration without changing the dark mode switch, which starts based on OS preference.

## Contributions

We welcome contributions! Please feel free to fork this repository, submit pull requests, make feature requests, report bugs, or ask questions.
