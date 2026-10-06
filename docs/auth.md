# Sign-in: sessions held by our server

How signing in works, and why. Designed 2026-10-04, reviewed by three agents (security, fit with
this stack, simplicity) and checked against Zitadel's own examples.

## Why

When the browser signed in with Zitadel itself, you had to sign in again in every new tab, and
after closing one:

- The browser kept the sign-in tokens per tab (session storage on live). A new tab had none.
- Restoring sign-in from a hidden frame can't work: Zitadel refuses to be framed and keeps its own
  cookie same-site (its defaults), and Safari and Firefox block the cross-site cookie anyway.
- Our server kept nothing: every protected call carried the token and the API asked Zitadel about
  it each time (introspection).

It also left the browser holding a token that could change your Zitadel account (the account
page called Zitadel's API directly), and its sign-in libraries were unmaintained.

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
| `api/src/config/trpc.ts`             | `secureProcedure` / `adminProcedure` / `accountProcedure` read the session (once per request, only when used).                                           |

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
  by default). The provider's refresh lifetime matches it ("Zitadel"). A session that ends costs a
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

- `services/session.ts`, a plain module like `services/toast.ts`:
  `whenSignInKnown()` (one `session.get`; it never rejects, and says whether the server answered:
  pages that need sign-in go home with a message rather than to sign in when it didn't), reactive
  `signedIn`, `hasRole()`, `signIn(returnTo)` (a full page load to `/auth/login`), `signOut()` (a
  form POST). A tRPC `UNAUTHORIZED` marks you signed out.
- The router check: pages with `meta.signIn` wait for `whenSignInKnown()`, then send you to
  sign in, or to `/no-access` without `meta.role`.
- Account composables call `account.*`. No tokens, axios or provider URLs in the client.
- tRPC uses a relative `/trpc`; Vite proxies `/trpc` and `/auth/` to 8788 with
  `changeOrigin: false` (the shorthand rewrites Host, which breaks the origin check and the
  callback address on 5173).
- The component preview has a stand-in for `services/session.ts`.

## Zitadel (the current provider)

- One instance, its address `OIDC_ISSUER` (`api/wrangler.toml`), with a project per environment
  (`somefreq-prod`, `somefreq-dev`). A project's id is `ZITADEL_PROJECT_ID`, and its Web app's
  client id and secret are `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET`: prod's ids in
  `api/wrangler.toml` and its secret in Cloudflare, dev's all in `api/.dev.vars`. Dev signs in with the same instance unless
  `api/.dev.vars` sets an `OIDC_ISSUER` of its own.
- Per project (prod, dev): a Web app, code flow, Basic client secret, Authorization Code + Refresh
  Token grants. Redirect: `/auth/callback` (dev: 8788 and 5173, development mode on). Post-logout:
  `/`.
- The instance's token lifetimes (its OIDC settings): access and ID tokens 12 hours, refresh
  tokens 30 days in all and 30 days idle, as long as a session.
- The old sign-in's, unused since 2026-10-04 and kept so an older version of the app can still run
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

- Vars: `OIDC_ISSUER`, `OIDC_CLIENT_ID` (Zitadel's Web app), `APP_ORIGINS` (the site's own
  addresses, comma-separated: "Forged requests"); the adapter's own:
  `ZITADEL_PROJECT_ID`.
- Secrets: `OIDC_CLIENT_SECRET` (the Web app's), `SESSION_SECRET` (32 random bytes:
  `openssl rand -base64 32`), optionally `SESSION_SECRET_PREVIOUS`.
- Dev only: `DEV_INSECURE_COOKIES`, as Safari won't keep a Secure cookie over
  `http://localhost`.
- No longer read: `ZITADEL_INTROSPECTION_ENDPOINT`, and `ZITADEL_CLIENT_ID` /
  `ZITADEL_CLIENT_SECRET` (the API app's; kept for an older version, see "Zitadel").

The origins and the cookie setting are checked at once, on every request that reads them (each
tRPC call), so a wrong `APP_ORIGINS` breaks the whole API. The provider's settings and the
sealing secret are checked when first used, so a missing secret breaks signing in, not the whole
API. Preview deployments can't sign in: their addresses aren't registered with the provider.

## Adding account features

The server holds your token, so more of the provider's self-service can become our own UI, the way
the email change works: one method on `AccountProvider`, Zitadel's implementation of it in
`providers/zitadel.ts`, one `account.*` procedure, one UI. The rules:

- Your user id always comes from the session, never from input.
- Only what the provider lets a user do to themselves. Managing other users is a different
  permission model (a least-privilege service account), designed separately.
- Sensitive changes (email, password, authenticators) require a recent sign-in.
- With Zitadel, its v2 user API, except where v1 does what v2 can't (the profile: v2 can't clear
  a field).
- Passkeys and security keys are tied to the domain you sign in on, which is Zitadel's. Registered
  from our site they wouldn't work at Zitadel's login, so they stay on Zitadel's page (unless
  Zitadel ever runs on our domain).

Likely next: password change, authenticator app (TOTP), phone number. Each one confirmed against
Zitadel's API when it's built.

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
- A language list of our own on the account page: it uses Zitadel's.

## Later

- Back-channel logout (the provider tells us when its session ends; `provider_session_id` is stored
  for it).
- Account features as capabilities, so the account page shows only what the provider supports;
  added when a second provider needs it.
- A Cloudflare rate limit on `/auth/*`; a per-session limit on email resends.

## References

RFC 10017 / BCP 212 (OAuth 2.0 for Browser-Based Apps), RFC 9700 (OAuth 2.0 Security BCP), OWASP
Session Management and CSRF cheat sheets, Zitadel: "Increase your SPA security with Cloudflare
Workers", self-service, OIDC endpoints, back-channel logout; Zitadel issues #9331, #9631, #7321
and #12637; `zitadel/example-auth-nextjs`, `example-auth-hono`; Zitadel's login app (`apps/login`).
