# cfp-stack

Setting it up, developing, the commands and the checks: `README.md`. Hosting, deploying and the
settings: `docs/hosting.md`. Signing in's setup: `docs/auth.md`, "Zitadel". Schema changes:
`docs/database.md`, "Migrations". Every doc, and where each kind of information goes:
`docs/README.md`.

- One file at a time: reason → sign-off → edit. Simple, behaviour-neutral files may be batched
  with one review at the end.
- New vocabulary goes to the owner for approval first: classes, tokens, component names, props,
  services. Names, comments and docs are in plain user terms.
- Checks Claude runs: `pnpm typecheck --all` (the API's reads `api/dist`, which `pnpm dev` keeps
  built), `pnpm test` (which checks doc citations too) and, after a layout change,
  `pnpm test:ui`. Lint and build only when asked.
- Review findings are checked with the `verify-findings` skill
  (`.claude/skills/verify-findings/SKILL.md`).
- Never loosen validators or system limits without approval. Ask before undoing work.
- Commit only when asked. Other sessions may be working in this repo on the same branch: check
  `git status`, then stage and commit only your own files and hunks, each named (never
  `git add -A` or `commit -a`).
- Production changes only with the owner's go-ahead: `pnpm migrate:push:api`, `pnpm seed:live`,
  and a push to `main`, which deploys (`docs/hosting.md`, "The Pages project").
- Files are opened with the Read tool, not `cat` or `sed`: that's what loads a rule in
  `.claude/rules/` for the files it covers.
