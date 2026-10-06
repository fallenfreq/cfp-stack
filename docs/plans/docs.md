# Plan: where information lives

Each piece of information gets one home, chosen by who needs it and when; anywhere else names
it. The guide this plan builds is `docs/README.md`. Deleted when done, as every plan is.

## Plan

Each step runs as `.claude/skills/ship-step/SKILL.md` says (from step 5 on; the steps before
followed the same stages).

1. **The guide and its check.** `docs/README.md`: the docs, where each kind of information goes,
   and how a doc is cited. `pnpm test` checks every citation (`test/docReferences.test.mjs`).
2. **The READMEs and hosting.** The root README takes the setup from `CLAUDE.md`; its
   out-of-date tRPC example and its Zitadel and Cloudflare walkthroughs go. `client/README.md`
   (Vue's starter text) is replaced and a README added in `api/`, each saying what the package
   is. A hosting doc in `docs/`: what lives in Cloudflare (the Pages project `cfp-stack`, D1, the
   secrets by name, deploying). Zitadel's settings stay in `docs/auth.md`, "Zitadel" only; copies
   elsewhere go. The README no longer invites contributions.
3. **`docs/database.md` and `docs/auth.md` become reference.** The database's open findings go
   to "Known issues", applying a migration on live is written in (from its steps 2–4), and the
   map-data decision moves there from Claude's memory. Each doc's lasting facts move to their
   home, then its Plan and Progress are removed. This is the database plan's step 7.
4. **Path rules and the secrets setting.** `.claude/rules/` `database` and `auth`: a few lines
   each, naming the doc to follow when touching those files. `CLAUDE.md` asks for files to be
   opened with the Read tool, which is what loads a rule. `.claude/settings.json` denies
   reading `api/.dev.vars`.
5. **Skills.** `verify-findings` (a finding is shown happening, and the code's intent
   understood, before it's acted on), `migrate` (it follows `docs/database.md`), then
   `ship-step`, which lists a step's stages and names the skill for each. Sharing the branch with
   other sessions is a line in `CLAUDE.md`, not a skill.
6. **`CLAUDE.md` trimmed** to the rules for every task and which commands Claude runs when,
   citing the READMEs for the rest. The working method's rules for every task (commit only when
   asked, no lint or build unasked, findings verified, limits kept) stay; its sf/sl ones move to
   a `theme-system` path rule in the same commit, so they're never in two places, and its
   type-check commands become the ones `pnpm typecheck` runs.
7. **Comments** (optional): what a caller reads becomes `/** */`, one package at a time.
8. **Later, with the other session:** the theme spec split into reference, explanation and
   internal design; its todo given a plan's lifecycle; user docs begun.

Steps 2 to 6 and 8 change what the other session works from (`CLAUDE.md`, and its todo's
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
- **Step 2 done** (2026-10-06, `49a9614`): the READMEs; `docs/hosting.md`, checked in Cloudflare's
  dashboard and with wrangler (the build, the domain, the secrets by name); what each setting is,
  moved from the settings files to their docs; `CLAUDE.md` from 131 lines to 44. Reviewed by an
  agent; its twelve findings checked, ten fixed. Found, from before this step: a preview should
  answer 500 for the API and the stylesheet (`docs/hosting.md`, "Known issues");
  `pnpm logging:api` names no project; `wrangler.toml`'s `name` isn't the project's;
  `tsconfig.check.json`'s comment says the check doesn't need `dist/`, which it does;
  `docs/auth.md`, "Settings" still says "before pushing the switch". Unit tests pass (4 + 24).
- **Step 3 done** (2026-10-06): `docs/database.md` (from 285 lines to 129) and `docs/auth.md`
  (from 473 to 298) are reference. Their plans, progress and rollout are gone, each fact that
  still holds moved to its home: applying a migration on live, two decisions (one from Claude's
  memory, deleted there), each doc's known issues, the API's in `api/README.md`, two reasons as
  comments in `api/src/db.ts` and `api/src/auth/sessions.ts`. The other session's todo points at
  the doc, with a note for it. Reviewed by an agent; its ten findings checked, nine fixed, one
  declined (the dev Web app's id stays only in `api/.dev.vars`, as the live one is only in
  `api/wrangler.toml`). Unit tests pass (4 + 24).
- **Step 4 done** (2026-10-06): path rules for the database and signing in, and a deny rule for
  `api/.dev.vars`. A fresh session that opened `api/src/db.ts` and `api/src/auth/oidc.ts` with
  the Read tool got each rule's text, once a session; this one, which made them, didn't. A read
  of `api/.dev.vars` from `api/` was blocked by the deny rule, and `api/.dev.vars.example` stays
  readable. Reviewed by an agent; its five findings checked and fixed (a rule loads through the
  Read tool, wider paths, the guide's row). Unit tests pass (4 + 24).
- **Step 5 done** (2026-10-06): the skills `verify-findings`, `migrate` and `ship-step`; sharing
  the branch is a line in `CLAUDE.md` (the owner's call), whose findings rule now names the skill.
  A fresh session lists the three skills; this one, which made them, doesn't. On a copy of local
  D1, `--persist-to` reads the copy (and a wrong path silently makes an empty database, so the
  skill lists first). Reviewed by an agent; its nine findings checked: eight fixed, and one
  refuted (the skills not found, which a fresh session showed was this session's list). Claude's
  memory note on sharing the branch is deleted. Unit tests pass (4 + 24).
- **Next:** step 6, the theme-system rule and the `CLAUDE.md` trim, starting with its plan.
