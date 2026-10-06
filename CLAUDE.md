# cfp-stack

Setting it up, developing, the commands and the checks: `README.md`. Hosting, deploying and the
settings: `docs/hosting.md`. Signing in's setup: `docs/auth.md`, "Zitadel". Schema changes:
`docs/database.md`, "Migrations". Every doc, and where each kind of information goes:
`docs/README.md`.

- Checks Claude runs: `pnpm typecheck --all`, `pnpm test` (which checks doc citations too) and,
  after a layout change, `pnpm test:ui`.
- Production changes only with the owner's go-ahead: `pnpm migrate:push:api`, `pnpm seed:live`,
  and a push to `main`, which deploys (`docs/hosting.md`, "The Pages project").
- Files are opened with the Read tool, not `cat` or `sed`: that's what loads a rule in
  `.claude/rules/` for the files it covers.
- Other sessions may be working in this repo on the same branch: check `git status`, then stage
  and commit only your own files and hunks, each named (never `git add -A` or `commit -a`).

## Working method (sf/sl theme system)

The theme system's spec is `client/src/assets/sf-system.md`; open work and where to resume is
`client/src/assets/sf-system-todo.md`, "Current state (resume here)".

- One file at a time: reason → sign-off → edit. Simple, behaviour-neutral files may be
  batched with one review at the end.
- Classes (and comments) state meaning; the theme decides the look. Plain user terms.
- Flag new vocabulary for approval: classes, tokens, component names, props, services.
- Theme creators and content creators must not need to know about each other.
- Review findings are checked with the `verify-findings` skill
  (`.claude/skills/verify-findings/SKILL.md`).
- Never loosen validators or system limits without approval. Ask before undoing work.
- Don't auto-run lint or build; typechecks are fine:
  `cd client && ./node_modules/.bin/vue-tsc --noEmit -p tsconfig.app.json`,
  `cd api && ../node_modules/.bin/tsc --noEmit -p tsconfig.src.json` (and
  `tsconfig.functions.json`; `tsc -p .` checks nothing).
- Component preview: `node --no-warnings client/preview/build.mjs` (`--serve` → :4173).
- Layout checks: `pnpm test:ui` runs `client/e2e` in the installed Chrome against the dev
  server (8788, started if needed), with a stylesheet built from the seed in memory. Each runs
  under the root theme and a deliberately different test theme (`e2e/testTheme.ts`, never
  seeded), so checks state behaviour, not looks or pixels. The cases are on
  `/editor?seed=tests`; add one for each layout fix. The demo-page snapshot fails on any move;
  accept an intended one with `pnpm test:ui --update-snapshots`. `SF_SYSTEM_CSS=<file>` checks
  another stylesheet. Known limits are checks marked expected to fail (`e2e/known.spec.ts`).
  After editing client code, let the dev build finish first: a page loaded mid-rebuild times
  out.
- Commit only when asked. Browser floor is Safari 17.4 (themes are emitted in `@scope`); no
  compat code below it.
- Bumping `api/src/domain/seedVersion.ts` needs a reseed (`pnpm seed:local`; `pnpm seed:live`
  after the change is deployed: live builds the stylesheet with its own code).
