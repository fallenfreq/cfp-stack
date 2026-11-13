# Plan: saves that can't make a second page or replace other work

Two ways Save loses or doubles work today (`client/src/assets/sf-system-todo.md`, "Saves that
can't make a second page or replace other work"). Deleted when done, as every plan is.

1. **A second page.** A new page's first save is stored, but its answer is lost (the connection
   drops, or the 30 seconds run out). The editor still thinks the page is new, so Save again
   makes another (`my-page-2`), and asks for the name again.
2. **Work replaced.** The same page open in two tabs or on two devices: whichever saves last
   replaces the other's work, and nobody is told.

## What the author sees

| Case                                                                         | Today                                  | After                                                       |
| ---------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| A new page's first save lands but its answer is lost; Save again             | the name is asked again; a second page | not asked again; the same page, saved with what's on screen |
| A save of an open page lands but its answer is lost; Save again (more typed) | saved                                  | saved, as today                                             |
| A save with no answer lands late, after a newer one from the same editor     | the older content replaces the newer   | not saved: the newer content stays                          |
| The page was saved in another tab or device after this one opened it; Save   | saved over the other, unasked          | not saved; the question below                               |
| Renamed, published, its address or collections changed elsewhere; Save       | saved                                  | saved: only the content is guarded                          |

**A refused save** (owner, 2026-11-13) shows the confirm dialog there already (`showConfirm`),
"This page was saved somewhere else after you opened it. Save over that version with yours?",
with **Save over it** (marked as danger) and **Cancel**. Cancel leaves a message until it's
closed, "Not saved. Your edits are still here.", whose button, **Open the other version**,
opens the page's Preview in a new tab: read-only, so the page isn't edited in a third place.
Save again asks again. Either way the edits stay on screen and unsaved. Both are the dialog and
message the app has, as they are.

**The pages list's New page** (owner, 2026-11-13). Today it asks the name and makes an empty
page at once; a lost answer there makes a second page too. It opens the editor on a new page,
as a collection's New page does (`/editor?autoTag=…`, without the collection), and the page is
made at its first Save, which asks the name. One way to make a page, and a page left without
saving isn't made. New: the name is asked at Save, not before the editor opens.

## How it works

Each page keeps two new things:

- **Its version**, a number that only goes up.
- **The editor that saved it last** (`saved_from`): a random key the editor makes each time it
  opens a page, new or stored.

Each save sends the editor's key and two versions: the one it was made from (the last the server
confirmed to this editor) and the one it will make (one more than both that and the last this
editor sent). The server takes the save if either:

- the page is still at the version the save was made from: nobody saved since; or
- this editor saved the page last, and the page is below the version this save will make: every
  version since is this editor's own (saves whose answer was lost), and this one is newer.

It then stores the version the save makes. Anything else is refused (409). An editor's own older
save arriving late makes a lower version than the page has, so it's refused: nobody is waiting
for its answer. Versions can skip a number (a save that never arrived); they only go up.

Why both: the version alone would refuse a retry after a lost answer, as its own first try moved
the page on; the key alone can't tell whether someone else saved since. This is the usual pair, a
version for edits at the same time (optimistic concurrency, as HTTP's `If-Match`) and a sender's
key for a request sent again (as Stripe's `Idempotency-Key`). The key is the editor's rather than
each save's, because a save sent again after more typing is a new save and must still be taken.

**A new page's first save** sends the key, and makes version 1 (2, 3… for each try after). If a
page with that key is there already, a first try landed, and this one is a save of that page,
taken by the key rule alone (it has no version it was made from). It writes the content and the
name in the title now; the collections stay as the first try made them.

Only the content is guarded. The name, address, published and collections are each one value,
and a change to one doesn't refuse a content save made from an older version (otherwise renaming
a page in the list would refuse the save of the same page open in the editor). Two changes to
the same one at once: the last stays, as today.

## Where

- **The table** (`api/src/schemas/page.ts`), with its migration: `version` (an integer, not null,
  default 1) and `saved_from` (text of 36, a `randomUUID`; NULL until a save sets it; one page
  per key, a `uniqueIndex`, which allows any number of NULLs). Both added columns: the migration
  is read to make sure no table is rebuilt. Names approved (owner, 2026-11-13): `version`,
  `saved_from`, and the route `save`.
- **The server** (`api/src/routes/pages/router.ts`). One function for the rule, used by `save`
  and by `create`'s repeat: one write that sets the content, the version the save makes,
  `saved_from` and `updatedAt`, where the page is that one and the rule above holds (the
  conditions in Drizzle's `eq`, `or`, `and`, `lt`; no `sql` template), with `.returning()`. The
  rule is in the write, so nothing can save in between. No row back: a read tells a page that's
  gone (404, as now) from one that moved on (409, "This page was saved somewhere else after you
  opened it").
    - `save` takes `{ pageId, contentJson, version, newVersion, savedFrom }`, all required: the
      versions whole numbers from 1, the new one above the other (so a save can't lower the
      version), the key a UUID, picked from the table's columns as the other inputs are, without
      the column's NULL (`.unwrap()`): a save or create without a key would never match it. It
      answers `{ version }`.
    - `create` takes the key and the version it makes. It inserts as now. An insert refused
      because a page has that key is the repeat: the index decides, as for slugs, and
      `insertWithUniqueSlug` passes that refusal on, as it only catches its own column's. (Not
      `onConflictDoNothing()` then a read, as the database doc says for a row that may be there:
      `newestId` pairs the collections with the newest row, so the insert must always add one.)
      The repeat goes through the rule's function, matching by key, with the name too. If no
      page has the key by then (deleted, or saved from another tab meanwhile), the insert is
      tried once more. It answers `{ pageId, slug, version }`.
    - `update` no longer takes `contentJson`, and refuses any field it doesn't take
      (`.strict()`): an editor open from before the deploy that sends content to `update` is
      refused, not answered "Saved" with nothing written (zod drops a field an input doesn't
      name). It doesn't change the version.
    - The public `getBySlug` leaves out the two columns. The admin reads send them.
- **The editor** (`client/src/stores/editorStore.ts`):
    - `setEditor` makes a new key, and clears the versions with the page's id.
    - Keeps the version from `setPage` and from each save's answer, and the last version it
      sent. A save takes the key and versions when it starts; its answer changes the editor only
      if the same page is still open, as now.
    - A new page keeps the name asked when its first save gets no answer (`noAnswer`), so Save
      again doesn't ask again; a name the server refused is asked again.
    - Its save shows its own error (`meta: { showsOwnError: true }`, `config/queryClient.ts`), so
      a refused save shows only the question; any other error shows as now. **Save over it**
      reads the page's version now (`getWithTags`) and saves from it, so a third save in between
      is refused too. If that read fails, its error shows as any other; if the page is gone,
      "This page has been deleted" shows. The edits stay either way. The question is part of the
      save under way, as the name question is, so leaving waits for it.
- **The pages list's New page** (`AdminPagesView.vue`), as decided above.

## Checks

- **The server**, with the real routes on a database in memory (`api/test/`, as
  `pagesAndCollections.test.mjs`):
    - A first save sent twice with one key makes one page, with the second's content and name.
    - A first save arriving after its own retry is refused, and makes no second page.
    - A retry after the page made by the first try was deleted makes one page.
    - A save from an older version is refused (409), and the page keeps the newer content.
    - A save sent again after its first try landed (same key, same version made from, new
      content) is taken; the first try arriving after it is refused, and the newer content stays.
    - Another key's save in between: the first editor's next save is refused.
    - A rename, address, published or collections change leaves the version as it was.
    - `update` with `contentJson` is refused.
    - A save of a page that's gone answers 404.
    - The public `getBySlug` doesn't send the two columns.
- **The editor**, in Chrome and WebKit, with the server's answers faked (`client/e2e/app.spec.ts`;
  the fakes of `adminPages.update` that stand for content saves move to `save`, and the fakes of
  `create`, like `addPage` in the server's checks, send a key and a version):
    - A first save whose answer is lost, then Save again: the name isn't asked, and the second
      create sends the same key and a higher version.
    - A refused save shows the question and no other message; Cancel leaves the edits unsaved;
      Save over it reads the version and saves from it; a page gone says so.
    - New page in the pages list opens the editor, and the first Save asks the name.

## Deploying

The new code needs the columns, so the migration goes on live first, then the push
(`docs/database.md`, "Applying a migration on live"), both with the owner's go-ahead. The code
running until the push doesn't know the columns and leaves them as they are. After the push, an
editor open from before it is refused its content save, with zod's "Unrecognized key", and its
edits stay on screen (`client/README.md`, "Known issues"). Older deployments share the database
(`docs/hosting.md`, "D1"): an editor opened on one still saves content through its own `update`,
unguarded. Only the owner opens those. The commits not yet pushed (3c54e7e to eaa20fa) go out
with it, or before.

## Not in this plan

- **A new page's first try that finds its key gone** (accepted by the owner, 2026-11-13). The
  repeat finds the page by `saved_from`, which the next save from another editor replaces, as
  does reopening the page. So a try that lands after the page was saved elsewhere, or reopened
  and saved, makes a second page with what that try sent: a first save with its answer lost
  (Save again in the first tab), or one held on the server past the 30 seconds. Nothing typed is
  lost, and it needs that timing; a never-changing key (`created_from`) would close it, for a
  third column. The comment at `create`'s repeat says so, so it isn't raised again.
- **Telling an author when the page is open somewhere else**, as WordPress's post lock does
  ("being edited by…", with Take over), for when several people edit. It would sit on top of
  this, not replace it: a lock can be taken over or go stale, and a lost answer still needs the
  key.
- **A new page named as another** still gets the next free address (`-2`), as today.
- **Two Saves at once from one editor:** the Save button can't be pressed while a save is under
  way (`SfButton`'s `loading`), and a save sent again after one with no answer makes a higher
  version.
