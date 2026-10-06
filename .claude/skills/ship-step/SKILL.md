---
name: ship-step
description: Take one step of a plan in docs/plans/ from its plan to its commit - plan, build, check, review, verify, approval, progress, commit. Use when starting or continuing a plan's step.
---

1. **Plan.** Read the step and the code it touches. Show the owner what will change, file by
   file, with any new names for approval, and wait for their sign-off.
2. **Build** what was signed off, and only that; a schema change with the `migrate` skill.
   Anything found outside it is logged and raised.
3. **Check** with what `CLAUDE.md` lists, and by running what the change does (the dev server, a
   query, the page), not only its types.
4. **Review:** one agent, given the plan, the diff and what to look for, told to change nothing
   and never to open `api/.dev.vars`.
5. **Verify** its findings with the `verify-findings` skill.
6. **Progress:** the step's entry in the plan (the date, what was checked, what was found) and
   its "Next" line.
7. **Ask for the commit:** what changed, what the review found and what was done with each
   finding, and the files to commit. Wait for the owner.
8. **Commit** only this step's files and hunks, the Progress entry with them, as `CLAUDE.md`
   says.
