# Sign-in: sessions held by our server

Design, agreed 2026-10-04. Reviewed by three agents (security, fit with this stack, simplicity) and
checked against Zitadel's own examples. The build follows the steps under "Rollout", one at a time.

## Progress (resume here)

Each step: its files approved, built, checked, reviewed by an agent, committed. Then this section
is updated, so a fresh session can pick up from it.

- **Step 0, Zitadel apps: done** (2026-10-04).
    - A "Web" app in each project: Code flow, Basic client secret, Authorization Code + Refresh
      Token grants.
        - Dev (`somefreq-dev`): client id `393640438516458992`; callbacks
          `http://localhost:{8788,5173}/auth/callback`, sign-out back to `http://localhost:{8788,5173}/`,
          development mode on. Its id and secret are in `api/.dev.vars` (`OIDC_CLIENT_ID`,
          `OIDC_CLIENT_SECRET`).
        - Live (`somefreq-prod`): client id `393641495095256560` (in `wrangler.toml`); callback
          `https://somefreq.com/auth/callback`, sign-out back to `https://somefreq.com/`. Its
          secret is a Production secret in Cloudflare (`OIDC_CLIENT_SECRET`), unused until step 3.
    - Instance token lifetimes: access and ID 12 h, refresh 30 days in all (was 90), idle 30 days.
    - The Cloudflare Pages project is named `cfp-stack`; `wrangler.toml` says `somefreq-pages`. Any
      `wrangler pages` command that takes a project name needs `cfp-stack`.
- **Step 1, server sign-in (unused): done** (2026-10-04). Reviewed by two agents together with
  step 0 and committed with it. Refreshing and re-checking moved to step 3, with the procedures
  that use them.
    - Built: `api/src/auth/{provider,oidc,index,sessions,sealing,http}.ts`,
      `api/src/providers/zitadel.ts`, `api/src/schemas/session.ts`,
      `api/functions_src/auth/[action].ts`, `api/test/auth{Http,Sealing}.test.mjs`, migration
      `0001_petite_bloodscream.sql` (creates `sessions` only; applied locally), `openid-client`
      6.8.8, settings (`wrangler.toml` live values, `.dev.vars.example`; dev values and a generated
      `SESSION_SECRET` in `.dev.vars`).
    - Checked: types, unit tests (return address, cookies, cross-site check, sealing), lint,
      layout checks; by hand on 8788, with another sign-in under way: `/auth/login` → Zitadel →
      `/account` left a row (roles `["admin"]`, three sealed tokens, 30 days) and the cookie; a
      same-origin sign-out POST deleted the row and cleared the cookie; cross-site and
      header-less sign-outs get 403; the old sign-in routes still reach the app.
    - Shaped while building: the contract has only what step 1 uses (refresh, re-check, reading a
      session and `AccountProvider` join in step 3). `auth/index.ts` puts sign-in together from
      its settings (`authFromEnv`). The return address is kept absolute (a path like `//evil.com`
      would leave the origin).
    - Changed after review (security; stack fit and simplicity):
        - One sign-in cookie per sign-in under way, named by its `state` (two tabs signing in at
          once broke each other); a state that can't name a cookie is refused.
        - The sign-in checks are opaque outside the provider; the cookie holds them and the return
          address as JSON.
        - Settings: the origins and cookie setting are checked at once; the provider's and the
          sealing secret when first used (so step 3's tRPC check won't fail on a missing secret).
          The Zitadel adapter reads its own `ZITADEL_PROJECT_ID`.
        - Discovery keeps only its result (a Worker mustn't await another request's fetch).
        - A session that fails to save revokes the new refresh token; sign-out still finishes,
          home, if the provider can't be reached.
        - Dev cookie names are the site's own (`somefreq-session`), as every app on localhost
          shares cookies.
    - Found: the callback never sees the session cookie (Strict; the provider's redirect is
      cross-site), so signing in again leaves the old row until it expires. Step 3's recent
      sign-in must handle that (see "Recent sign-in").
    - Still to do for live, before step 3: apply `0001` to live D1 (ask first; wrangler here isn't
      signed in to Cloudflare, `npx wrangler login`), and create `SESSION_SECRET` in Cloudflare
      (Production).
- **Step 2 done:** tRPC calls the page's own `/trpc`; Vite (5173) proxies it to 8788, keeping
  the Host. `VITE_API_HOST/PORT` are gone. Before, every call from 5173 asked 8788 for
  cross-origin permission and was refused, so no data loaded there. `/auth/` joins the proxy in
  step 3: until then `/auth/signinwin/zitadel` is a page of the client's own. Checked on 8788
  and 5173 with the old token.
- **Step 3, the switch: done** (2026-10-04). Reviewed by two agents (security; stack fit and
  simplicity).
    - Built: reading, refreshing (the lease) and re-checking in `sessions.ts`; `forRequest` in
      `auth/index.ts` (each request's session, read once and only when asked for); `session.get`;
      `account.*` through `AccountProvider` (Zitadel's in `providers/zitadel.ts`); the procedures
      read the session (`accountProcedure` added); the cross-site check in `[[trpc]].ts`;
      `/auth/login?recent=1` and the earlier session ended at the callback. Client:
      `services/session.ts`, the account page on `account.*`, `utils/accountOptions.ts` (was
      `zitadelOptions.ts`, values in our terms), the router check (from `refs/wip/router-check`),
      `/auth/` in the Vite proxy, the preview's stand-in. Gone: `@zitadel/vue` (with
      `vue-oidc-client` / `oidc-client`), `axios`, `jwt-decode`, `cors`, `jsonwebtoken`, the
      client's `zod`, both `client/.env` files, the introspection settings. CLAUDE.md "Auth setup"
      and the README's sign-in setup rewritten here rather than in step 4.
    - Checked: types, unit tests, layout checks (106; a first run had 3 failures that didn't come
      back in two runs), the component preview; by hand on 8788 and through 5173:
        - signing in (Zitadel's own session: no password), a new tab signed in, admin pages;
        - a re-check keeps `admin` (user info carries the roles);
        - two refreshes in a row, and five calls at once while one was due (one refresh, all
          answered);
        - profile saved, a nickname set and cleared;
        - the email change refused without a recent sign-in, then "Confirm it's you": a
          password, the earlier session ended, and the request reached Zitadel (the same address,
          refused unchanged);
        - a token that won't open ends its session, and the app then shows you signed out;
        - signing out (row deleted, Zitadel's session ended, home);
        - forged requests: cross-site, same-site, a foreign or `null` Origin and none at all get
          403; form, text and untyped posts 415.
    - Shaped while building:
        - The profile is saved with Zitadel's v1 `users/me/profile`: v2 can't clear a field (a
          nickname). Zitadel refuses a profile saved unchanged, and its error text is
          translated, so the adapter compares first.
        - `AccountProfile` is re-exported from `appRouter.ts`: the client's emitted types must
          name it, and that is the one module it can import.
        - The adapter returns `{ identity, account }` (`Provider`), so `auth/index.ts` makes one
          call.
    - Changed after review:
        - Every call that needs sign-in is re-checked (at most every 10 minutes), not only admin
          and account calls: someone the provider ends loses access within minutes, not 30 days.
        - A token that's missing or won't open ends its session (so rotating `SESSION_SECRET`
          without `_PREVIOUS` signs everyone out, as "Tokens at rest" says).
        - The earlier session goes to the callback as its id, not its hash: a copy of the
          database can't end anyone's session.
        - `recent=1` asks the provider for proof within a minute, well inside the 10 minutes the
          change allows, so you aren't sent round twice.
        - New tokens that fail to save are revoked; only Zitadel's 400 and 409 are "refused" (a
          limit reached isn't a wrong code); sign-in reads roles from user info, as the re-check
          does; a sign-in that can't be checked asks to try again; the account page shows the
          server's refusal messages; "not known" isn't "signed out" (no sign-in loop when the
          server can't answer).
    - Found (predates this):
        - tRPC sent stack traces with every error but internal ones (`onError` blanked those):
          its `isDev` is on unless `NODE_ENV` is `production`, which Workers don't set; live's
          "please log in" answer carried one. Fixed after step 3: `isDev: false` in
          `config/trpc.ts`.
        - `[[trpc]].ts` returns `fetchRequestHandler(…)` without `await`, so its outer catch
          never sees tRPC's own failures (Cloudflare's generic error page, no stack); `onError`
          logs internal errors without their stack.
        - Any signed-in user can delete any map marker or tag (`markers.delete`, `deleteTag`).
          Not a priority: the map is a demo and the owner has the only account.
        - `user.insert` logs every user. (`secure.test`, which logged its input, is gone with
          the starter's other probes, `test` and `echo`.)
        - The account page's language list is Zitadel's (kept, by choice); `usePage` still
          blanks when sign-in lands (a shorter wait now).
        - The page shows you signed out until `session.get` answers.
    - Still to do for live, before pushing: apply `0001` to live D1 and create `SESSION_SECRET`
      in Cloudflare (Production) (see step 1).
- **Step 4, the old setup: kept, by choice** (2026-10-04). The old apps and their secrets stay so
  an older version can still run; "Zitadel" lists them as the old sign-in's. `.npmrc` no longer
  hoists `vue-oidc-client` (gone since step 3).
- **Live, ready for the push** (2026-10-04): `0001` applied to live D1 (none left to apply), and
  `SESSION_SECRET` created in Cloudflare (Production; generated straight into it, never shown).
- **Live: done** (pushed `e9c57d7`, 2026-10-04). Checked on somefreq.com: `/account` signed out
  sends you to Zitadel; signed in (the user's password), `session.get` and `account.profile`
  answer `no-store`; a new tab opens `/admin` signed in; signing out goes home, signed out; no
  stack in error answers.
- **Left:** delete the old setup listed in "Zitadel" once no older version will run; the
  "Found (predates this)" items under step 3, each with the user's go-ahead.

## Why

You have to sign in again in every new tab, and after closing one:

- The browser keeps the sign-in tokens per tab (session storage on live). A new tab has none.
- Restoring sign-in from a hidden frame can't work: Zitadel refuses to be framed and keeps its own
  cookie same-site (its defaults), and Safari and Firefox block the cross-site cookie anyway.
- Our server keeps nothing: every protected call carries the token and the API asks Zitadel about
  it each time (introspection).

Also fixed on the way: the browser holds a token that can change your Zitadel account (the account
page calls Zitadel's API directly), and the sign-in libraries are unmaintained.

## The shape

Our server signs you in with the identity provider (Zitadel), keeps the provider's tokens itself
and refreshes them. The browser gets only our own cookie, which every tab sends. The browser never
sees a provider token and never calls the provider's API; it calls ours, and ours calls the
provider on your behalf.

This is the "backend for frontend" pattern, ranked most secure by RFC 10017 / BCP 212 (Aug 2026)
and recommended by Zitadel for apps on Cloudflare Workers. Zitadel's official examples
(`zitadel/example-auth-nextjs`, `example-auth-hono`) have the same shape: a Web app, code flow +
PKCE + client secret, `openid-client` for refresh and sign-out, the server calling Zitadel with the
stored access token. We differ where they're weaker (see "Decided against").

## The provider boundary

Ports and adapters: the rest of the app depends on a small contract written in our terms, and one
adapter fulfils it with Zitadel. Another provider means another adapter that meets the same
contract, and a changed import and call where the adapter is chosen.

- The client already knows no provider: it talks only to our API (`session.get`, `account.*`,
  `/auth/login`, `/auth/logout`).
- Sign-in is a standard (OpenID Connect), so most of it is shared by any compliant provider.
  Sessions, cookies, sealing and the cross-site check are ours and don't care who the provider is.
- What differs per provider lives in its adapter: extra scopes, where roles come from (mapped to
  our roles, e.g. `admin`), sign-out details, and the account API, which is entirely
  provider-specific.

The contract (`api/src/auth/provider.ts`):

- `IdentityProvider`: the sign-in address, finishing sign-in (which returns our user: `subject`,
  name, email, roles, `authTime`, `providerSessionId`, and the tokens), refresh, checking the user
  is still valid, revoking, the sign-out address.
- `AccountProvider`: your profile, the email change, and each later account feature.

Shaped by what we use now, not a general identity SDK. Not solved by it: moving users to another
provider (their ids differ) and every session ending once; those are migration tasks.

## Server

### Files

| File                                 | Its one job                                                                                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/src/auth/provider.ts`           | The contract: `IdentityProvider`, `AccountProvider` and the types they return, in our terms. No code.                                                    |
| `api/src/auth/oidc.ts`               | The standard OpenID Connect part of `IdentityProvider`, for any compliant provider (`openid-client` 6), with hooks for scopes and for claims → our user. |
| `api/src/providers/zitadel.ts`       | The only code that knows Zitadel: its scopes, its role claim → our roles, and its `AccountProvider` (Zitadel's user API).                                |
| `api/src/auth/index.ts`              | Puts sign-in together from its settings: chooses the adapter (one import and call), cookies, origins, the session store.                                 |
| `api/src/auth/sessions.ts`           | Session rows in D1: create, read, refresh (one at a time), re-check, end. Uses `IdentityProvider`. No HTTP.                                              |
| `api/src/auth/sealing.ts`            | Encrypting tokens at rest (WebCrypto). No imports, so unit tests load it directly.                                                                       |
| `api/src/auth/http.ts`               | Cookies (names, attributes, clearing), the return-path rule, the cross-site request check. No imports, unit-tested.                                      |
| `api/src/schemas/session.ts`         | The `sessions` table.                                                                                                                                    |
| `api/functions_src/auth/[action].ts` | `/auth/login`, `/auth/callback` (GET), `/auth/logout` (POST): thin, calls the modules above.                                                             |
| `api/src/routes/session/router.ts`   | `session.get`: who you are (name, email, roles) or nothing. Public.                                                                                      |
| `api/src/routes/account/router.ts`   | `account.*`: your profile and email, through `AccountProvider`, with the session's token and the session's user id (never one from input).               |
| `api/functions_src/trpc/[[trpc]].ts` | Rejects cross-site requests; gives the context a session loader.                                                                                         |
| `api/src/config/trpc.ts`             | `secureProcedure` / `adminProcedure` / `accountProcedure` read the session (once per request, only when used). Introspection and axios go.               |

No root `_middleware.ts`: at the root it would run a Function in front of every static file.

### Signing in

1. `GET /auth/login?returnTo=…`: makes `state` and a PKCE verifier, keeps them and the return path
   in a short-lived cookie (`__Host-signin-<state>`, Lax: it must survive the trip back from the provider),
   and sends you to the provider. The return path is resolved against our origin and refused unless
   it stays on it (`new URL(r, origin).origin === origin`); a pattern check was bypassable with a
   tab (`/\t/evil.com`).
2. `GET /auth/callback`: checks `state` against the cookie (also blocks login CSRF), handles the
   provider's `error=`, exchanges the code with the client secret (`ClientSecretBasic`, explicitly:
   the library otherwise posts it), validates the ID token, reads your roles and profile from user
   info (`expectedSubject` = the ID token's `sub`), creates a session with a new random id, and
   sends you back to the return path (checked again).

Scopes: `openid profile email offline_access`, plus the adapter's. Zitadel's: the project audience,
the Zitadel API audience (`urn:zitadel:iam:org:project:id:zitadel:aud`, needed for the account API)
and `urn:zitadel:iam:org:projects:roles`.

### Sessions

- Cookie value: 32 random bytes. The table stores only its SHA-256, so a copy of the database holds
  no usable cookie.
- `sessions`: id hash, `subject` (the provider's user id), `provider_session_id` (for back-channel
  logout later), name, email, roles, `auth_time`, sealed access / refresh / ID tokens, access token
  expiry, refresh lease, last re-check, created, expires.
- Lifetime: 30 days from sign-in, fixed (the cookie's `Max-Age` is set once, so reads never write).
  It also ends when the provider refuses a refresh (Zitadel's refresh token is idle after 30 days
  by default). Align the provider's absolute refresh lifetime with it. A session that ends costs a
  quick trip through the provider, with no password while the provider's own session lasts.
- Expired rows are swept at sign-in.

### Cookies

- `__Host-Http-session`: HttpOnly, Secure, `SameSite=Strict`, `Path=/`, no Domain. Strict works:
  only our own fetches and the sign-out form need it.
- `__Host-signin-<state>`: the same but Lax, 10 minutes. One per sign-in under way, so sign-ins in
  two tabs don't undo each other.
- Clearing either repeats `Secure; Path=/`, or the browser ignores it.
- Dev over `http://localhost` (Safari refuses Secure cookies there): `somefreq-session` /
  `somefreq-signin-<state>` without Secure, chosen by a setting in `.dev.vars`
  (`DEV_INSECURE_COOKIES`), never by the request. The site's own names, since every app on
  localhost shares cookies. Live only reads and writes the prefixed names.

### Tokens at rest

Sealed with AES-GCM. The key comes from `SESSION_SECRET` (32 random bytes) through HKDF, one key per
purpose. Each value gets a fresh 96-bit IV and is bound to its row (additional data: the session's
id hash, `subject` and the column), so a sealed token copied to another row won't open. Format
`v1.<iv>.<ciphertext>`. `SESSION_SECRET_PREVIOUS` is accepted for opening only, to rotate the key;
rotating without it signs everyone out. (Zitadel's own login app signs its cookies the same way:
HKDF per purpose, versioned.)

### Refreshing

Written for the strictest case, which is Zitadel's: refresh tokens are single-use with no grace
(issues #9631, #7321), and a refresh ends the old access token at once (#9331). So:

- Refresh when under a minute of the access token remains, and only one request at a time: claim a
  lease (`UPDATE … SET refresh_lease = mine WHERE … AND lease is free or stale`, one row changed =
  ours). Lease 30 s; the request to the provider times out at 10 s.
- Run the refresh and the write inside `waitUntil` (awaited), so a closed tab doesn't lose a used
  refresh token. Write only `WHERE refresh_lease = mine`.
- `invalid_grant`: re-read the row; if the refresh token is unchanged, end the session. Network or
  5xx: release the lease and keep the session.
- Other requests carry on with the cached identity. Account calls, which need a live token, wait
  briefly for the lease and re-read, or answer "try again".

### Re-checking with the provider

For every call that needs sign-in (not `session.get`), at most every 10 minutes: user info with
the access token. Success
updates roles, name and email; a 401 ends the session. If the provider can't be reached, keep the
cached identity, but refuse admin calls once the last good check is over an hour old. (Refreshing
alone wouldn't notice with Zitadel: an ended Zitadel session still lets refreshes through, as
issue #12637 reports.)

### Signing out

`POST /auth/logout`: delete the row, clear the cookie, revoke the refresh token (in `waitUntil`;
Zitadel then revokes its access token too), answer 303 to the provider's end-session with the newest
ID token as `id_token_hint` (or just `client_id` if it's missing) and our home page as the return.
Our session ends before leaving, so nothing needs checking on the way back. `Cache-Control:
no-store` on every `/auth/*` response.

### Forged requests

In `[[trpc]].ts` and the logout handler: accept only `Sec-Fetch-Site: same-origin`; without that
header, require `Origin` in the allowed list (`APP_ORIGINS`); a missing or `null` Origin is
refused. `/trpc` POSTs must be `application/json` (tRPC also takes form posts, which another site
can send without asking). tRPC queries are GETs and change nothing. `Cache-Control: no-store` on
session-dependent tRPC responses.

### Recent sign-in for sensitive changes

`auth_time` is kept per session. Changing the email requires it within 10 minutes; otherwise the
client sends you through `/auth/login?recent=1&returnTo=/account` first, which asks the provider
for proof from the last minute (`max_age=60`), leaving time to make the change. The same check guards
any later sensitive change (see "Adding account features").

The callback can't read the session cookie (Strict, and the provider's redirect is cross-site), so
a sign-in made while signed in must not leave the earlier session behind: `/auth/login` can read
it (a same-site navigation) and passes its id on in the sign-in cookie for the callback to end.

### Logging

Sign-in success and failure (`subject`, reason), sign-out, a refresh that ends a session, failed
re-checks, refused cross-site requests (with `Sec-Fetch-Site` and `Origin`). Never tokens, the
cookie, `code`, the verifier, or request bodies.

## Client

- `services/session.ts` replaces `services/zitadelAuth.ts`, a plain module like `services/toast.ts`:
  `whenSignInKnown()` (one `session.get`; it never rejects, and says whether the server answered:
  pages that need sign-in go home with a message rather than to sign in when it didn't), reactive
  `signedIn`, `hasRole()`, `signIn(returnTo)` (a full page load to `/auth/login`), `signOut()` (a
  form POST). A tRPC `UNAUTHORIZED` marks you signed out.
- The router check (built, uncommitted): pages with `meta.signIn` wait for `whenSignInKnown()`,
  then send you to sign in, or to `/no-access` without `meta.role`. `meta.authName` becomes
  `meta.signIn`.
- Account composables call `account.*`. No tokens, axios or provider URLs in the client.
- tRPC uses a relative `/trpc`; Vite proxies `/trpc` and `/auth/` to 8788 with
  `changeOrigin: false` (the shorthand rewrites Host, which breaks the origin check and the
  callback address on 5173).
- Gone: `@zitadel/vue`, `vue-oidc-client` / `oidc-client`, `jwt-decode`, axios, the startup gate
  and `$zitadel` in `main.ts`, the callback routes, `VITE_API_HOST/PORT`,
  `VITE_API_ZITADEL_CLIENT_ID`, `VITE_API_ZITADEL_PROJECT_RESOURCE_ID`.
- The component preview gets a stand-in for `services/session.ts`.

## Zitadel (the current provider)

- Per project (prod, dev): a Web app, code flow, Basic client secret, Authorization Code + Refresh
  Token grants. Redirect: `/auth/callback` (dev: 8788 and 5173, development mode on). Post-logout:
  `/`.
- The absolute refresh token lifetime is 30 days (instance OIDC settings; set in step 0).
- The old sign-in's, unused since step 3 and kept so an older version of the app can still run
  (delete them once none will):
    - A User Agent app per project, which the browser signed in with (`@zitadel/vue`): prod
      `282311473735258121`, dev `282876108658061416`. Its redirects are
      `/auth/signinwin/zitadel` and `/auth/signinsilent/zitadel`.
    - An API app per project, which our server asked about each token (introspection): prod
      `282314634059446901`, dev in `api/.dev.vars`.
    - Their secrets: `ZITADEL_CLIENT_SECRET` in Cloudflare (Production); `ZITADEL_CLIENT_ID`,
      `ZITADEL_CLIENT_SECRET` and `ZITADEL_INTROSPECTION_ENDPOINT` in `api/.dev.vars`. An older
      version brings its other settings with it (`wrangler.toml`, the client's `.env` files).

## Settings

- Vars: `OIDC_ISSUER`, `OIDC_CLIENT_ID` (Zitadel's Web app), `APP_ORIGINS`; the adapter's own:
  `ZITADEL_PROJECT_ID`.
- Secrets: `OIDC_CLIENT_SECRET` (the Web app's), `SESSION_SECRET`, optionally
  `SESSION_SECRET_PREVIOUS`.
- Dev only: `DEV_INSECURE_COOKIES`.
- No longer read: `ZITADEL_INTROSPECTION_ENDPOINT`, and `ZITADEL_CLIENT_ID` /
  `ZITADEL_CLIENT_SECRET` (the API app's; kept for an older version, see "Zitadel").

The new ones are checked on the auth paths only, so a missing secret breaks sign-in, not the whole
API. Set them in Cloudflare (Production) before pushing the switch. Preview deployments can't sign
in: their addresses aren't registered with the provider.

## Adding account features

The server holds your token, so more of the provider's self-service can become our own UI, the way
the email change works: one method on `AccountProvider`, Zitadel's implementation of it in
`providers/zitadel.ts`, one `account.*` procedure, one UI. The rules:

- Your user id always comes from the session, never from input.
- Only what the provider lets a user do to themselves. Managing other users is a different
  permission model (a least-privilege service account), designed separately.
- Sensitive changes (email, password, authenticators) require a recent sign-in.
- With Zitadel, prefer its v2 user API; move today's v1 profile call over when touching it.
- Passkeys and security keys are tied to the domain you sign in on, which is Zitadel's. Registered
  from our site they wouldn't work at Zitadel's login, so they stay on Zitadel's page (unless
  Zitadel ever runs on our domain).

Likely next: password change, authenticator app (TOTP), phone number. Each one confirmed against
Zitadel's API when it's built.

## Rollout

Each step leaves the site working.

0. Zitadel: create the Web apps; set the refresh lifetime.
1. Server sign-in, unused: the `sessions` table (Drizzle migration: generate, check it only creates
   `sessions`, commit; local, then live after `wrangler d1 migrations list --remote`),
   `provider.ts`, `oidc.ts`, `providers/zitadel.ts` (identity part), `auth/index.ts`,
   `sessions.ts` (create, end), `sealing.ts`, `http.ts`, `auth/[action].ts`, unit tests.
   Tried by opening `/auth/login` by hand.
2. tRPC on a relative `/trpc` with the proxy, still sending the old token.
3. The switch, one commit: reading, refreshing and re-checking in `sessions.ts`, `session.get`,
   session-based procedures, the cross-site check, `account.*` with Zitadel's `AccountProvider`,
   the client service, the router check (`refs/wip/router-check`), `/auth/` in the Vite proxy,
   removed packages and settings.
4. The old Zitadel apps and the old `ZITADEL_CLIENT_SECRET` secret in Cloudflare: kept for now, so
   an older version can still run, and listed in "Zitadel". (CLAUDE.md "Auth setup" and the
   README were rewritten in step 3.)

Signed-in users sign in once more at step 3. Tabs left open on the old page get UNAUTHORIZED until
they reload.

## Tests

Unit (`api/test`): the return-path rule (tab, CR, `/\`, `%5C`, `https:evil`), cookie headers
including clearing, sealing round trips and refusing a token moved between rows. Layout checks:
signed out is the real `session.get` (null); fake it only where the signed-in UI matters.

## Decided against

- Tokens in browser storage, shared across tabs: a long-lived refresh token readable by any script.
- Allowing Zitadel to be framed: loosens its protections instance-wide, and Safari still blocks it.
- Zitadel on our own domain: not on the free plan.
- Linking to Zitadel's own account page instead of editing here (option A): smaller, but you want
  the account features in the site.
- A service account for account changes: an org-wide write role in a secret; your own token is
  least privilege.
- Auth.js (what Zitadel's examples use): in maintenance since Sept 2025. Its cookie-only sessions
  can't be ended server-side, race on refresh, and the examples hand the access token to the
  browser. Better Auth brings its own user model; more than we need.
- A root `_middleware.ts`: runs a Function in front of every static file.
- A required custom header on tRPC calls: with the same-origin check, JSON-only posts, a Strict
  cookie and read-only GETs it adds nothing here.
- A runtime provider switch or plugin system: one import is enough until a second provider exists.

## Later

- Back-channel logout (the provider tells us when its session ends; `provider_session_id` is stored
  for it).
- Account features as capabilities, so the account page shows only what the provider supports;
  added when a second provider needs it.
- A Cloudflare rate limit on `/auth/*`; a per-session limit on email resends.

## Found while designing (predates this)

`user.insert` is a public mutation that writes to the database. `cors` and `jsonwebtoken` were unused
API dependencies (removed in step 3).

## References

RFC 10017 / BCP 212 (OAuth 2.0 for Browser-Based Apps), RFC 9700 (OAuth 2.0 Security BCP), OWASP
Session Management and CSRF cheat sheets, Zitadel: "Increase your SPA security with Cloudflare
Workers", self-service, OIDC endpoints, back-channel logout; Zitadel issues #9331, #9631, #7321
and #12637; `zitadel/example-auth-nextjs`, `example-auth-hono`; Zitadel's login app (`apps/login`).
