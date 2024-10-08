## This is a copy of myStack that ## This is a copy of myStack that has been refactored to run on Cloudflare Pages but has the same functionality. We are now using the free plan of Zitadel instead of self-hosting, We are still using drizzle as an ORM but with Cloudflare's D1 serverless database. The readme bellow is for the original and still needs to be amended.

# Tech Stack Monorepo

## Overview

The project aims to provide a somewhat opinionated, comprehensive, nearly production-ready web application setup with everything needed for a modern application, including HTTPS, authentication, a component library, and more out of the box. The goal is to minimize setup time and streamline the development process, allowing developers to start working on application-specific code as quickly as possible. It selects type-safe tools that combine rich features with ease of use, enhancing development speed and reliability.

It includes:

- **TypeScript**
- **Vue 3**
- **Vuestic UI**
- **PrimeVue (unstyled with Tailwind)**
- **Tailwind CSS**
- **Vite**
- **Zitadel**
- **tRPC**
- **Drizzle ORM**
- **Docker**
- **Nginx**

## Setup

### Certificates

Ensure that `privkey.pem` and `fullchain.pem` certificates exist in the `./certs` directory. For development purposes, you can generate a certificate authority and self-signed certificates using the scripts provided in the `./certs` directory. Don’t forgot to let your OS or browser trust your CA file.

The scripts use openssl and realpath. You might need to install openssl and coreutils (which includes realpath) if they are not already installed on your OS. Then, update the OPENSSL_BIN variable inside the script files to the location of the binary for your version of OpenSSL.

### Environment Variables

Create a copy of any `.example` files and fill them in, removing the `.example` extension. For example, `.env.example` becomes `.env`. The defaults in the .example are fine for testing out the project other than a few variables that are mention in the authentication section. You may also want to fill out the SMTPConfiguration at `zitadel/zitadel-secrets.yaml` if you require email confirmation from users.

### Authentication

Zitadel needs to be running for the login button to work.
You'll also need to login to the Zitadel console, create a Vue app to login to, create an API app for the API to do token inspection and add the appropriate `.env` vars to the client and API `.env` files.

#### Create Login App

- Go to`https://localhost:4443`
- Create a project and save the Resource ID as `VITE_API_PROJECT_RESOURCE_ID` in the client `.env` file
- Add a new application and select User Agent then PKCE for an SPA
- Add `https://localhost/auth/signinwin/zitadel` and `https://localhost:5173/auth/signinwin/zitadel` as Redirct URIs
- Add `https://localhost:5173/` and `https://localhost/` as Post Logout URIs
- Save the Client ID as `VITE_API_CLIENT_ID` in the client `.env`

#### Create Token Inspection App

- Go to`https://localhost:4443`
- Go to your previously created project
- Add a new application and select API then Basic for the tRPC API
- Save the client ID and client secret as `ZITADEL_CLIENT_ID` and `ZITADEL_CLIENT_SECRET` in the api `.env` file

You can see more information on how to login to a single page application with Zitadel [here](https://zitadel.com/docs/examples/login/vue).

You can see more information on how we secure the API routes with Zitadel via token inspection and how to set up the API app in Zitadel [here](https://zitadel.com/blog/testing-token-introspection-with-postman).

### Database

You connect to a PostgreSQL database using the variables in the API .env file. You can spin up a PostgreSQL database in a Docker continer with `pnpm db:api` that will use the same variables. Once you have a database, run `pnpm migrate:api` to generate the migrate files and `pnpm migrate:api:push` to push them to the database. You'll also need to do this when you change the `api/src/schemas` files.

## Development Commands

We are using PNPM to make this a monorepo with PNPM workspaces. Corepack is required for the `packageManager` field in the `package.json` to be acknowladged. It may or may not have been included with your install of Node.js. Corepack also needs enabling by running `corepack enable`

More information can be found on Corepack [here](https://nodejs.org/api/corepack.html)

- **Start Zitadel:** `pnpm docker:up:zitadel`
- **Start Development Database:** `pnpm db:api`
- **Install Dependencies:** `pnpm install`
- **Build API and Client:** `pnpm build`
- **Generate migrate files** `pnpm migrate:api`
- **Push generated migrate files to the database** `pnpm migrate:api:push`
- **Start API and Vite Dev Server:** `pnpm dev`

### Ports

- Zitadel: `https://localhost:4443`
- Vite Dev Server: `https://localhost:5173`
- The main server which serves the Vite build files and the tRPC API uses the default https port of 443 so you can omit the port number. `https://localhost`

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

The framework currently has the option to use Vuestic and PrimeVue components. You can customise the colours for both by editing the variables at client/src/assets/base.css

### Tailwind and Vuestic

We are currently favouring Vuestic to PrimeVue.

Read more about integrating Tailwind with Vuestic [here](https://ui.vuestic.dev/styles/tailwind).

The `client/cssVariables.js` file is generated by `client/plugins/extractCssVars.ts` so that variables can be accessed and passed to the `vuestic.my.config.ts` to avoid duplicating colour definitions. We are using `vuestic.my.config.ts` instead of vuestic.config.js because Vuestic has commands such as `npx sync-tailwind-with-vuestic` that can generate the `vuestic.config.js` file and would therefore overwrite our bespoke one.

### Tailwind and PrimeVue

PrimeVue components are unstyled (This is what PrimeVue call it when the styling is done via the pt property) and styled with Tailwind. We cannot use `tailwindcss-primeui` until PrimeVue v4 supports Tailwind presets.

- [Tailwind CSS PrimeUI](https://github.com/primefaces/tailwindcss-primeui)
- [PrimeVue Tailwind](https://primevue.org/tailwind/)

Set a PrimeVue Tailwind theme by downloading your required components in your chosen theme from [here](https://tailwind.primevue.org/builder/) and add them to client/src/presets

### Themes

There's currently a dark mode, light mode and secret pink mode, press cmd+k to toggle pink mode. The secret pink mode was just to test if more than 2 themes could be implemented efficiently with the current configuration without changing the dark mode switch which starts based on os preference.

### Docker

Docker is used for Zitadel and you can also optionally run a database with docker. Theres also the option to run the API in docker along with Zitadel and your PostgreSQL database, essentially containerising the entire project since the API module also serves the client files. Running `docker-compose up` will do this and have everything sat behind Nginx as a reverse proxy. Zitadel, always starts as a container and has its own network, including it's own Nginx, databases etc.

## Contributions

We welcome contributions! Please feel free to fork this repository, submit pull requests, make feature requests, report bugs or ask questions.
