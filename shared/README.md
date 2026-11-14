# @somefreq-app/shared

What the api, the client and the validator all need, used as is: TypeScript with no build (Node
strips the types, and Vite and Cloudflare's bundler read it), so no side builds it and none waits
on another's build. Keep it free of dependencies.

- `slug.ts`: what a slug may hold, and making one from a name.
- `layouts.ts`: the `sl-` layout classes as lists, for the fixed CSS and the validator.
- `headings.ts`: what a heading's prominence class looks like, for the heading block and the
  validator.
- `corners.ts`: the CSS properties that set a box's corners, for the Corners tool and the
  validator.
- `tsconfig.json` (`pnpm typecheck`): the repo's shared strict settings, as `validator/`'s are.
  None of its files imports another yet; the first that does by its `.ts` ending needs
  `rewriteRelativeImportExtensions` in `api/tsconfig.base.json`, as the API's check refuses it
  (TS5097) without.
