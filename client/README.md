# client

The site and its editor, in Vue 3. Vite builds it into `api/client_dist`, which the Pages
project serves with the API. It has no settings of its own. Its browser floor is Safari 17.4,
as themes are emitted in `@scope`: no compat code below it.

## Layout

- `src/views/`: the pages, and `src/router/` maps addresses to them.
- `src/components/`: the site's parts, the editor's (`editor/`) and the demos' (`demos/`).
- `src/editor/extensions/`: what the editor (TipTap) adds to its blocks and marks.
- `src/services/`: the API's data as the pages use it, who's signed in, and toasts and prompts.
- `src/stores/`, `src/composables/`: shared state and behaviour.
- `src/trpc.ts`: the API's client, typed from `api/src/routes/appRouter.ts`.
- `src/assets/`: the base styles, and the theme system's spec, references and open work.
- `e2e/`: the layout checks. `preview/`: the component preview.

## Checks

- Types: `vue-tsc --build`.
- Layout: `e2e/`, in the installed Chrome against the dev server at 8788 (started if needed), with a
  stylesheet built from the seed in memory. Each check runs under the root theme and again under a
  deliberately different test theme (`e2e/testTheme.ts`, never seeded), so checks state behaviour,
  not looks or pixels; only the demo page's and the theme comparison run once. The cases are on
  `/editor?seed=tests`. The demo page's snapshot fails on any move; an intended one is accepted with
  `--update-snapshots`. `SF_SYSTEM_CSS=<file>` checks another stylesheet. Known limits are checks
  marked expected to fail (`e2e/known.spec.ts`). After editing client code, let the dev build finish
  first: a page loaded mid-rebuild times out.
- Components: the preview built from `preview/`.

Running it and its checks, from the root: `README.md`, "Developing" and "Commands".

## Known issues

- `vite.config.ts` pins `cssTarget` below the browsers that read range syntax (Safari 14, Chrome 87,
  Edge 88, Firefox 78; 2026-06-19), so the minifier keeps media queries they read. The floor has
  since been raised to Safari 17.4 (2026-10-01), which doesn't need it.
- `playwright.config.ts`'s comment says every check runs under both themes; the demo page's and
  the theme comparison run once.
- A change the server refuses on the admin pages shows nothing: renaming, changing a slug,
  publishing, deleting, a new page or collection (`useListItemActions.ts`, `views/admin/`).
  Nothing catches the error and the query client shows only failed reads, so a slug that's
  taken (409), a name of spaces or a new name with no letter or number (400) is refused without
  a word; a page's collections reload instead. The editor's Save shows the server's message,
  which for a refused input is zod's issues as JSON. Read in the code, not tried in a browser. A
  fix at the boundaries: the API gives a refused input a readable message, and the client
  shows, in one place, any error nothing else handled.
