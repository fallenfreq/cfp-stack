---
name: migrate
description: Change the database's schema - generate a migration from api/src/schemas, read it, apply it locally, and on live with the owner's go-ahead. Use for any change to api/src/schemas or api/migrations.
---

The rules and the live procedure are `docs/database.md`, "Migrations", "Applying a migration on
live". Claude's part:

1. **Generate** from the root: `pnpm migrate:api`. Read the SQL against "Migrations" and finish
   it by hand where that says to.
2. **Try it on a copy** when it rebuilds a table or moves rows. Copy `api/.wrangler/state/v3/d1`
   to `<copy>/v3/d1` in the scratchpad; from `api/`,
   `pnpm exec wrangler d1 migrations list somefreq-db --local --persist-to <copy>` must show only
   the new migration (a wrong path makes an empty database and lists them all). Apply it there
   (`… migrations apply … --persist-to <copy>`) and check every row it should keep is kept.
3. **Apply it locally:** `pnpm migrate:push:local:api`, then the checks of the procedure's last
   step.
4. **Live:** the procedure, step by step. Auto mode lets only `migrations list --remote` through;
   the other checks (`d1 execute --remote`) and every change need manual mode, so ask the owner
   for it first. Before each command that changes live, show what it will change or delete, and
   run it only with their go-ahead.
