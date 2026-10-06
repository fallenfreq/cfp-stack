# Docs

Each piece of information has one home, chosen by who needs it and when. Anywhere else names
that home, or is generated from it where a copy must exist.

## The docs

| File                                  | What it is                                                     |
| ------------------------------------- | -------------------------------------------------------------- |
| `README.md`                           | The project: what it is, setting it up, the commands           |
| Each package's `README.md`            | What the package is                                            |
| `docs/database.md`                    | How the API uses Drizzle and D1                                |
| `docs/auth.md`                        | Signing in: sessions held by our server                        |
| `docs/hosting.md`                     | What runs the site in Cloudflare, and the settings             |
| `client/src/assets/sf-system.md`      | The sf/sl theme system's spec                                  |
| `client/src/assets/sf-references.md`  | Outside work the theme system draws on                         |
| `client/src/assets/sf-system-todo.md` | The theme system's open work: a plan, kept by its spec for now |
| `docs/plans/`                         | Plans, while they run                                          |
| `CLAUDE.md`                           | What Claude needs in every session                             |

## Where things go

| Kind                                                          | Home                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| What the project is, setting it up, the commands, the layout  | The root `README.md`                                                                                         |
| What a package is, its layout, its checks                     | The package's `README.md`                                                                                    |
| How something works, its rules and why, its decisions         | Its doc, `docs/<topic>.md`                                                                                   |
| How to do something people do too (apply a migration on live) | Its doc; a skill that does it follows the doc                                                                |
| What a setting means                                          | Its topic's doc (signing in's: `docs/auth.md`, "Settings"); the files that set it cite that                  |
| A plan, its progress, what it finds                           | `docs/plans/<topic>.md` while it runs (below)                                                                |
| Open work                                                     | A plan, or its doc's known issues; not a TODO comment                                                        |
| Why code is as it is                                          | A `//` comment at the code; a reason that spans files is in its doc, which the comment cites                 |
| What a caller needs to know                                   | A `/** */` comment on what it calls, which editors show                                                      |
| History: what something was, which change made it so          | The commit message                                                                                           |
| A procedure only Claude runs                                  | A small skill in `.claude/skills/`; a bigger one names a skill for each stage                                |
| What Claude reads before touching some files                  | A path rule in `.claude/rules/`, a few lines naming the doc                                                  |
| A file Claude must not read, such as the secrets              | A deny rule in `.claude/settings.json`: it blocks the Read tool and shell commands that name the file        |
| What Claude needs in every session                            | `CLAUDE.md`: the rules for every task and which commands Claude runs when; it cites the READMEs for the rest |
| What one person's Claude has learnt about working with them   | Claude's memory, outside the repo; anything about the project goes in the repo                               |
| Help for content authors                                      | The editor                                                                                                   |
| Guides for theme and component authors                        | Docs here, once there's a first one                                                                          |

**Plans** run their course: when one is done, what it found that's still open goes to its doc's
known issues, its lasting facts to their homes, and the plan is deleted. Git keeps it.

## Citing a doc

Code and docs name a section as `(docs/auth.md, "Settings")`: the file's path from the repo's
root (its name alone, from its own folder or when no other file has it), then headings or bold
leads, each in quotes. A heading's closing parenthetical can be left out: "Zitadel" names
"Zitadel (the current provider)". `pnpm test` checks each citation in this form, so a doc moved
or a section renamed fails until what cites it follows.
