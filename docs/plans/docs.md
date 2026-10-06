# Plan: where information lives

Each piece of information gets one home, chosen by who needs it and when; anywhere else names
it. The guide this plan builds is `docs/README.md`. Deleted when done, as every plan is.

## Plan

Each step: show the plan → build → check → agent review → verify its findings → the owner
approves the commit → commit only that step's files → update Progress. Another session shares
`main`: stage only this work's files and hunks.

1. **The guide and its check.** `docs/README.md`: the docs, where each kind of information goes,
   and how a doc is cited. `pnpm test` checks every citation (`test/docReferences.test.mjs`).
2. **The READMEs and hosting.** The root README takes the setup from `CLAUDE.md`; its
   out-of-date tRPC example and its Zitadel and Cloudflare walkthroughs go. `client/README.md` (Vue's starter text) is replaced and
   a README added in `api/`, each saying what the package is. A hosting doc in `docs/`: what
   lives in Cloudflare (the Pages project `cfp-stack`, D1, the secrets by name, deploying). Zitadel's
   settings stay in `docs/auth.md`, "Zitadel" only; copies elsewhere go. The README no longer
   invites contributions.
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
   citing the READMEs for the rest. The working method's rules for every task (commit only when
   asked, no lint or build unasked, findings verified, limits kept) stay; its sf/sl ones move to
   their path rule, and its type-check commands become the ones `pnpm typecheck` runs.
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
- **No contributions invited** (2026-10-06). The owner may make the repository private and split
  the system (the editor, the theme system) from the site, versioned, to build other sites with
  it; whether it stays open source is open.

## Progress

- **Plan written** (2026-10-06).
- **Step 1 done** (2026-10-06, `7b599af`): the guide, and `pnpm test` checking citations. Every
  citation already resolved but one into a bold lead, which now counts as a section's name. In a
  throwaway copy the check failed on a moved doc and on renamed headings, wrapped citations
  included. Reviewed by an agent; of its nine findings, three were kept on purpose (the guide's
  "generated", uncommitted files checked too, a file outside the repo failing). Unit tests pass
  (4 + 24).
- **Next:** step 2, starting with its plan, at a pause in the other session's work.
