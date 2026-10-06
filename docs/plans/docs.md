# Plan: where information lives

Each piece of information gets one home, chosen by who needs it and when; anywhere else names
it. The guide this plan builds is `docs/README.md`. Deleted when done, as every plan is.

## Plan

Each step: show the plan → build → check → agent review → verify its findings → the owner
approves the commit → commit only that step's files → update Progress. Another session shares
`main`: stage only this work's files and hunks.

1. **The guide and its check.** `docs/README.md`: the docs, where each kind of information goes,
   and how a doc is cited. `pnpm test` checks every citation (`test/docReferences.test.mjs`).
2. **The READMEs and hosting.** The root README takes the setup from `CLAUDE.md`, with its tRPC
   example and Zitadel address put right. `client/README.md` (Vue's starter text) is replaced and
   a README added in `api/`, each saying what the package is. A hosting doc in `docs/`: what
   lives in Cloudflare (the Pages project `cfp-stack`, D1, the secrets by name, deploying). Zitadel's
   settings stay in `docs/auth.md`, "Zitadel" only; copies elsewhere go. The owner decides whether
   the README keeps "contributions welcome".
3. **`database.md` and `auth.md` become reference.** The database's open findings go to "Known
   issues", applying a migration on live is written in (from its steps 2–4), and the map-data
   decision moves there from Claude's memory. Each doc's lasting facts move to their home, then
   its Plan and Progress are removed. This is the database plan's step 7.
4. **Path rules and the secrets setting.** `.claude/rules/` `database`, `auth` and
   `theme-system`: a few lines each, naming the doc to follow when touching those files.
   `.claude/settings.json` denies reading `api/.dev.vars`.
5. **Skills.** `commit-own-hunks`, `verify-findings`, `migrate` (it follows `database.md`), then
   `ship-step`, which lists a step's stages and names the skill for each.
6. **`CLAUDE.md` trimmed** to the rules for every task and which commands Claude runs when,
   citing the READMEs for the rest; the sf/sl working method moves to its path rule.
7. **Comments** (optional): what a caller reads becomes `/** */`, one package at a time.
8. **Later, with the other session:** the theme spec split into reference, explanation and
   internal design; its todo given a plan's lifecycle; user docs begun.

Steps 2, 3, 4, 6 and 8 change what the other session works from (`CLAUDE.md`, and its todo's
pointer to sign-in's progress): each waits for a pause in it.

### Decisions

- **Reviewed** (2026-10-06) by two agents, one on Claude Code's documentation, one on
  documentation practice; their findings checked against the sources and the code.
- **No decision records.** A topic's current decisions are in its doc; their history is in the
  commits.
- **No typecheck skill or Claude Code hook.** Git's commit hook type-checks the packages a commit
  touches, and `pnpm typecheck` is the one command.
- **No generated settings docs.** Five schemas read the settings (`config/envs.ts` and the
  sign-in's), so none is the one source: a setting's meaning is in its topic's doc, which the
  files that set it cite.
- **Skills don't call each other.** A bigger skill lists the stages and names the skill for each.
- **No user docs folder until there's a user doc.** Content authors' help belongs in the editor.

## Progress

- **Plan written** (2026-10-06).
