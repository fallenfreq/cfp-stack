# @somefreq-app/validator

The rules the theme system relies on that nothing else checks: elements in, as hast, and CSS, as
CSSTree; results out. What each place that checks gives it, where each rule shows and why:
`client/src/assets/sf-system.md`, "Validator and linter".

TypeScript used as it is, with no build: Node strips the types, and Vite and Cloudflare's bundler
read it. It takes nothing from the client or the API: the lists of layouts are `shared/`'s
(`layouts.ts`), which the fixed CSS reads too. It walks the elements with unified's
`unist-util-visit` and `unist-util-visit-parents`, and reads and walks CSS with
`@eslint/css-tree`, the copy of CSSTree ESLint's CSS language reads, with its own types: 57 KB
gzipped, as its main entry, the only one typed, loads CSS's syntax data too.

- `core.ts`: what a rule and a result are, running the rules, and reading a block's own style.
- `rules/`: a file for each rule.
- Read by the client through its exports: `@somefreq-app/validator/core` (the editor's page
  reader, `client/src/editor/readPage.ts`) and `@somefreq-app/validator/rules/<file>` (the
  rules the editor runs, `client/src/editor/pageRules.ts`, and the client's tests).
- Checks:
    - `tsconfig.json` (`pnpm typecheck`): the repo's shared strict settings, and syntax Node
      can't strip or an import without its ending refused; `test/types.ts` holds what the types
      must refuse. An import ending in `.js` for a `.ts` file passes it, and Node refuses it once
      a test imports the file.
    - ESLint: no casts, `any` or `!` (`eslint.config.js`).
    - `test/`, in Node's runner (`pnpm test`): each page written as HTML (`test/checkHtml.mjs`),
      each block's style as CSS (`test/checkCss.mjs`). The root's `test/validatorRules.test.mjs`
      checks each rule's name is its entry in the spec.
