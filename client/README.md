# client

The site and its editor, in Vue 3. Vite builds it into `api/client_dist`, which the Pages
project serves with the API. It has no settings of its own. Its browser floor is Safari 17.4,
as themes are emitted in `@scope`: no compat code below it.

## Layout

- `src/views/`: the pages, and `src/router/` maps addresses to them.
- `src/components/`: the site's parts, the editor's (`editor/`) and the demos' (`demos/`).
- `src/editor/extensions/`: what the editor (TipTap) adds to its blocks and marks.
- `src/services/`: the API's data as the pages use it, who's signed in, toasts and prompts, and
  what an error says (`errors.ts`, the one place a failed call to the server is put into words).
- `src/stores/`, `src/composables/`: shared state and behaviour.
- `src/trpc.ts`: the API's client, typed from `api/src/routes/appRouter.ts`. Writes go through
  `useMutation`, so one that fails says why, as a read through `useQuery` does
  (`src/config/queryClient.ts`); so does an error a component's code didn't catch, or a promise
  of ours that failed with nothing waiting on it (`src/main.ts`).
- `src/assets/`: the base styles, and the theme system's spec, references and open work.
- `e2e/`: the layout checks. `test/`: the quick tests. `preview/`: the component preview.

## New versions

A tab runs the version it opened. Each page's code is a file of its own, loaded when the page is
first opened, and its name changes with each version; a deploy replaces every file. So in a tab
open from before a deploy, a page it hasn't opened yet can't load: live answers the missing file
with the site's page itself. Vite's documented fix (`vite:preloadError`, in `src/main.ts`) shows
"This page couldn't load. Refresh to try again." with a Refresh button, which loads the new
version (`src/services/errors.ts`). It never reloads by itself, so the editor asks before unsaved
edits go.

## Checks

- Types: `vue-tsc --build`.
- Quick tests: `test/`, in Node's runner (`pnpm test`), on the editor's own blocks with nothing
  drawn. `test/editorModules.mjs` lets Node load the editor's code: its `@/` paths, its files
  named without their ending, and its components as empty ones.
- Layout: `e2e/`, in the installed Chrome and in Playwright's WebKit (Safari's engine), against the
  dev server at 8788 (started if needed), with a stylesheet built from the seed in memory. In each
  browser, every check runs under the root theme and again under a deliberately different test
  theme (`e2e/testTheme.ts`, never seeded), so checks state behaviour, not looks or pixels; only
  the demo page's and the theme comparison run once. The cases are on `/editor?seed=tests`. The
  demo page's snapshot fails on any move; an intended one is accepted with `--update-snapshots`.
  WebKit has its own (`webkit/`): it draws text and form controls a little differently.
  `SF_SYSTEM_CSS=<file>` checks another stylesheet. Known limits are checks
  marked expected to fail (`e2e/known.spec.ts`). After editing client code, let the dev build finish
  first: a page loaded mid-rebuild times out.
- Components: the preview built from `preview/`.

Running it and its checks, from the root: `README.md`, "Developing" and "Commands".

## Known issues

- `vite.config.ts` pins `cssTarget` below the browsers that read range syntax (Safari 14, Chrome 87,
  Edge 88, Firefox 78; 2026-06-19), so the minifier keeps media queries they read. The floor has
  since been raised to Safari 17.4 (2026-10-01), which doesn't need it.
- A tab open from before a deploy calls the server as its version did, so a call that has changed
  since is refused, as tRPC words it ("New versions"). The editor's Save too: its edits stay on
  screen but can't be saved (read in the code), and a refresh asks before losing them. Fine while
  the one person editing is the one deploying (2026-11-12). Once others edit: a change to a
  call keeps its old form working for a while, and the editor could keep unsaved edits in the
  browser for a refresh to bring back.
