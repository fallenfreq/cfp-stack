# client

The site and its editor, in Vue 3. Vite builds it into `api/client_dist`, which the Pages
project serves with the API. It has no settings of its own.

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
- Layout: `e2e/`, in Chrome against the dev server at 8788.
- Components: the preview built from `preview/`.

Running it and its checks, from the root: `README.md`, "Developing" and "Commands".
