# sf/sl System — Implementation Drift

Tracks gaps between `sf-system.md` (the spec) and the current codebase. The spec
describes the target design; this file enumerates what needs to change in code to match.

## Current state (resume here)

**Sign-in work** (its own track, 2026-10-04): done; how it works is `docs/auth.md`.

**Note from the docs session** (2026-10-06; please delete this note once you've read it):
`docs/auth.md` and `docs/database.md` are reference only now, their progress logs gone, so the line
above points at the doc. `CLAUDE.md` is shorter: setup, commands and checks are in `README.md`,
Cloudflare and the settings in `docs/hosting.md`, and where each kind of information goes in
`docs/README.md`. It now also lists the checks Claude runs, and says that production changes need
the owner's go-ahead, that other sessions share the branch, and that files are opened with the Read
tool, which loads the rules in `.claude/rules/` for the files they cover. `pnpm test` also checks
that every citation like `(docs/auth.md, "Settings")` resolves. Your working method is now split:
what applies to every task stays in `CLAUDE.md` (review findings are checked with the
`verify-findings` skill in `.claude/skills/`), and the sf/sl part is
`.claude/rules/theme-system.md`, which loads when a client or theme file is opened with the Read
tool; the rule also points at "Current state (resume here)". How the layout checks work and the
browser floor are in `client/README.md`; the preview's command is `pnpm preview:components`; the
type-check commands are now `pnpm typecheck --all` (the API's reads `api/dist`, which `pnpm dev`
keeps built). Three of this file's own lines point at what's gone, for you to update or close: the
open sign-in item ("Sign-in through our own server", which says `docs/auth.md`'s "Progress" says
where it's up to; sign-in is live), "shipped with step 3 of `docs/auth.md`" (the steps are gone),
and the note that the starter tables went, citing `docs/database.md` (that history is in the commits
now).

**Editor** (2026-10-06): candidate 14 (undo after opening a page) is fixed and committed.
Candidate 15 (the code view as an editor of its own) and item 16 (TipTap 3.31.4, with what it
broke fixed) are fixed, reviewed and committed together. Item 17 (console errors and debug
lines) is fixed, reviewed and committed. Next: choose with the user.

**Next:** item 10 (rules that reach through a node view) and the layout checks below are
committed (2026-10-01). The browser floor is raised to Safari 17.4 (2026-10-01, decided with
the user), so themes in `@scope` apply on every supported browser. Item 8's to-do item bug
is fixed (2026-10-01). The room under the site nav is back (2026-10-01): it went when the nav
was rebuilt (27 Sep, the header's all-round margin became top padding), so the editor's bar
touched the nav. The app frame now puts the page margin between header, page and footer, and
pages add no top room of their own (`SfPageShell`, the map). Margins that merge were tried
and rejected: they add up in the frame's flex column and inside any sl layout. A stored page
(home, preview) now sits in the page shell, which gives it the page margin; its content has no
spacing of its own, so it can be shown anywhere (a collection's sheet shows it bare). Picking a
shell per page comes later (decided with the user, 2026-10-01). The editor demo opens the demo
content built into the app (`/editor?seed=true`), the same locally and live.

**The editor shows the page in the page shell** (2026-10-02, pushed 2026-10-03). A document in
an inset now has its top-level blocks as the inset's items. They sit on its line; one set to bleed
reaches its edges; bands and bars keep the line; a layout that bleeds collapses at its own
width. See `sf-system.md`, "A document in an inset".

- **Rejected:** two designs that make the document a grid.
    - Sharing the inset's columns (subgrid): a width container can't.
    - Copying the inset's columns: hand-made layouts on the page then measured the full width,
      the gap cursor jumped to the top, and lists grew.
- **Reviewed** by a separate agent. Its fix (measure the bleed's width, not the margin) is what
  shipped; mine broke cards used as insets, card bands and bars.
- **Code review of the change** (`/code-review high`): eight findings. Seven are done; Safari
  waits (candidate 4 below).
    - Columns inside a plain block that bleeds measured the narrower document: up to two
      margins less than their width, so they stacked early. A block that bleeds now measures
      for what it holds.
    - A collection's sheet showed a page bare (no margins, no bleed). Decided with the user:
      ours should be an inset. `StackableSheet` is now one, its padding the margin, with its
      scrolling body a band, so a page there gets the sheet's line and bleeds to its edges.
      Checked by `app.spec.ts`, which fails on the old sheet.
    - The CSS found TipTap's mount box by its shape; it now wears a class, `page-content`
      (decided with the user), set by `PageContent` and the editor.
    - The component band's rule weighed one class more than the plain band's.
    - Every collapse rule carried a `:has()`; the document selector no longer needs one.
    - The test helpers were renamed for what they narrow (`setShellWidth`, `shellWidths`).
    - Formatting.
- **New names:** `--sfx-bleed-width`, `sf-bleed-area` and `page-content`.
- **Second code review** (`/code-review high`, of what came after the first): eight findings.
    - Checks: the faked API replies no longer reach the API when every call in a batch is
      faked. The document's width is measured exactly, and the "document at sm" width checks
      that the document is at or below sm.
    - Columns placed straight in an inset stack late: logged (candidate 5 below). It predates
      this change.
    - Not patched, agreed with the user: a page in an inset that centres its items is 0 wide
      (proved). It already was, as the document measures itself. Centring the other items
      one by one gives the same layout.
    - No change:
        - The editor's top bar keeps its controls one page margin from the screen edge, while
          the page and the nav sit on the page's line (24px against 160px in a 1600px window).
          Decided with the user: it's the editor's tool bar, not part of the page, so it stays
          put whatever shell a page uses.
        - "Nothing sticks out sideways" can't see overflow to the left. The position checks
          still catch the blocks that could.
        - The rule for a block that bleeds skips the popover and sized-by-content guards. Such
          a block takes its width from the page, never from what it holds.
        - The sheet's rows rely on `sl-inset` never setting `grid-template`. Nothing does.
- **The demo:** its image and code sample set to bleed; its Center blocks lost
  `sf-padding-lg`, which doubled the margin. On wide screens its reading column is 48px wider.
- **Checks:** `e2e/line.spec.ts` compares every case in "The page's line" with a reference
  that's the shell's own item, in five shells at four widths. One width puts the document at
  exactly sm, where a block that bleeds is still wider. It failed on the old rules, and
  without the rule for columns inside a block that bleeds. `setShellWidth` narrows the page
  shell, not the document.
- **Checked** (2026-10-03):
    - The user, in Safari 18.3.1: the image and the code sample stay touching both sides of
      the window while it's resized, wide to narrow and back (candidate 4 below).
    - In Chrome, at 1440px and 400px: clicking in the page margin beside a block puts the
      cursor on that line, at its start on the left and its end on the right. Tried beside a
      paragraph, plain and component Columns, and inside a card band's margin.
    - In Safari 18.3.1, from the user's screenshot: the hero image reaches both sides of a
      narrow window.
    - A long line of code wraps, in the editor and on a published page alike (the user saw it
      in Chrome and Safari; measured in Chrome on the home page at 1440px and 400px: nothing
      runs past its box and the page doesn't scroll sideways). Published pages use the same
      read-only editor, and the editor library's own style wraps code
      (`.ProseMirror pre { white-space: pre-wrap }`). The theme says nothing about it, so a page
      shown without the editor would not wrap. Nothing does that today.
    - The drag handle of a block that bleeds sits above the block's top-left corner, so at the
      screen's edge, in Chrome and Safari alike. Left as is.

**Seeding runs outside requests** (2026-10-03). One seed makes 3,324 queries; D1 allows 1,000
per request (50 on Workers Free) and the local dev server doesn't enforce it, so seeding inside a
request would stop partway live. The stylesheet seeded on first boot inside a public GET (wiping
first, two requests could race), and the admin `seed.run` route wiped then would stop. Now:

- `pnpm seed:local` / `pnpm seed:live` (`api/scripts/seed.mjs`) run the seed here, in a
  throwaway database in memory with all its checks, and write its rows to
  `api/.wrangler/seed-local.sql` / `seed-live.sql`: 10 statements (wipe the design, multi-row
  inserts, add the menu's collections if missing). Wrangler applies the file. Live first says
  which seed version it replaces and asks.
- Nothing seeds inside a request: an empty database's stylesheet answers 500 until a seed is
  run. The admin `seed.run` route and `POST /dev/seed` (with `DEV_SEED_SECRET`) are gone. A
  machine that built before this keeps a working `/dev/seed` locally (`tsc --build` leaves
  `api/functions/dev/seed.js`) until `pnpm build`; remove `DEV_SEED_SECRET` from its `.dev.vars`.
- Checked locally: a file that fails partway leaves the database as it was, and seeding an empty
  database or a seeded one both serve exactly the seed's stylesheet. Wrangler says the same for
  live (a failed run returns the database to how it was, safe to retry). `seed:live` first ran
  2026-10-03: the design stayed at 2.87.0 and the menu's two collections went in.
- Later: seed on deploy, right after migrations, once migrations run on deploy (today both are
  run by hand). Only when the seed version changes, and not once themes are edited live: a seed
  replaces the whole design.

Rule errors now reach the user with their message (`f91217f`, 2026-10-03). Some read like
developer text, e.g. the class-name check prints its pattern; rewording them is open.

**Live database** (2026-10-01): migration files are gitignored, so each machine generates its
own. Production's history holds three other sets (last applied 16 Jun) and lacked the 7 theme
tables; `pnpm migrate:push:api` from this Mac would try to create every table again. Going
live uses a one-off add-only SQL file (the 7 tables, the seeded themes copied from a fresh local
seed, the brand user, the home page, and this Mac's migration marked applied). The seed now
reaches live with `pnpm seed:live` (2026-10-03, above). Candidates:

1. **Scroll-frame arrows in documents:** the `sf-is-overflow-*` script doesn't run in pages
   (item 10, logged).
2. **Multi-select dropped a block that changed in place** (found 2026-10-01; fixed
   2026-10-03): ticking a selected to-do item, typing "## " in a selected paragraph or a
   heading shortcut took the block out of the selection. A change to a block's attributes or
   type rewrites only its start and end around its content (a block with no content, such as
   an image, is swapped whole), and position mapping counts that as deleting it. TipTap's own
   commands work so (ticking, `setNode`, `updateAttributes`), so the toolbar's code couldn't
   fix it. The toolbar can't make such a change itself: while any block is selected it shows
   only the selection's tools (`FloatingToolbar.vue`).
    - **Fix:** `multiSelect.ts` follows an edit step by step and keeps a block selected
      through a step that changes it in place (`changedInPlace`): one that rewrites only its
      start and end, or swaps a block with no content for one of its type. It goes by the
      step, not by what's left at the block's place. Unwrapping a selected block still drops
      it; undo, redo, typing and wrapping keep it (checked in Chrome).
    - **Checked:** `editor.spec.ts` ticks, types "## " and uses the shortcut on selected
      blocks, then deletes a selected divider with another after it; it fails without the fix
      and with the first fix below.
    - **Code review** (`/code-review high`, 2026-10-03): ten findings, checked.
        - Fixed, a regression in the first fix (proven in Chrome): it kept a block when what
          was left at its place had the same content, so deleting a selected divider (selected
          by its crumb, then Backspace) moved the selection to the divider after it. With both
          selected, the one left was listed twice, and moving the selection would then delete
          a block nobody selected. The review's Backspace in an empty paragraph didn't
          reproduce (it's dropped). The fix now goes by the step, as above.
        - Fixed: the test reads each block's place when it uses it, and covers that deletion;
          the cheap checks come first, without the throwaway array; this note said every
          change rewrites only a block's start and end (not so for an image).
        - Not real today: mapping step by step ignores mirrored steps (`Mapping.setMirror`),
          which only collaborative editing sets; this app has none (history keeps its mirrors
          to itself).
        - Left as is: a shared helper for selecting several blocks in the layout checks, until
          a second check needs one.
        - After the fixes: `editor.spec.ts` passes (16); a review of the fixes
          (`/code-review low`, which reads only `multiSelect.ts`) found nothing.
    - Logged, predates: Colour, Font, Aspect, Corners and Shadow check how many blocks are
      selected (`defaultItemsStyle.ts`), but the toolbar hides them whenever any is, so the
      checks never apply.
3. **Popovers and tooltips on Safari before 26** (found 2026-10-01; fixed and pushed 2026-10-03). They're placed by anchor positioning, which Safari has from 26. Before it, a
   popover sat in the middle of the screen (the user saw the nav's menu there in Safari
   18.3.1) and a tooltip in the top-left corner. The toolbar's panels and the tooltips had
   their own placement scripts until 27 Sep (`e304d60`).
    - **Fix:** `useAnchorFallback` (new name, approved by the user) places both from script,
      only in browsers without anchor positioning, by the same rules as the CSS. Chrome and
      Safari 26 keep the CSS. While a box is open it's checked every frame, as CSS anchoring
      is, and placed again when its button moves, its content changes size or the screen
      does.
    - **Checked:** `anchorFallback.spec.ts` fakes such a browser and checks each box lands
      exactly where Chrome's CSS puts it, at 1440px and 400px.
        - The nav menu.
        - Toolbar panels: below; from the last button (the other edge); from the second
          button (too wide for either edge at 400px, so spread across); with no room below
          (above); after the page scrolls; after an edit above.
        - Tooltips: above; slid back at the screen edge.
        - A panel on a short screen, and one too tall for it: candidate 6.

        Every case fails with the script off. The user saw the nav menu and a toolbar tooltip
        right in Safari 18.3.1, before the review's changes and again after them.

    - **Code review** (`/code-review high`): ten findings, all real. Checking every frame,
      instead of scroll and resize events and a size observer, fixed five:
        - a tall panel lost its scroll position whenever it was placed again;
        - a panel lagged behind a toolbar moved by an edit (reproduced in a separate run: it
          stayed at 310px instead of moving to 394px; inside the layout check something
          else happens to place it again, so the check guards this but missed the old bug);
        - the observer reported a loop error;
        - listeners stayed on when a box went without a close event;
        - every scroll did the full placement.

        Also fixed: start and end now follow the screen's direction, as the CSS's do; the
        scrolling height can't go below 0; tooltips no longer try each place twice. The checks
        gained the cases above.

4. **Check the page's line in Safari** (added 2026-10-02; checked by the user in Safari 18.3.1,
   2026-10-03: right, see "Checked" above).
   The bleed width is a registered length worked out from `100cqi` (`--sfx-bleed-width`,
   `slCombined.ts`). The layout checks only run in Chrome. Safari recomputes it when the
   window resizes; rotating and gaining a scrollbar weren't tried.
    - **To check:** open `/editor?seed=true` and resize the window, wide to narrow and back.
      The hero image and the code sample should stay edge to edge, with nothing sticking out
      sideways. Do the same with a page open in a collection's sheet.
    - **If it's wrong:** bleeding blocks stop short of the edges or push the page sideways.
      Running the layout checks in WebKit (candidate 7) would catch it from then on.
5. **Columns placed straight in an inset stack late** (found 2026-10-02 by the second code
   review; predates the page shell work, not fixed). An inset holding a collapsing layout is
   the box that layout measures, but the inset's margins are grid tracks. So it measures wider
   than the line its items sit on, by both margins. Checked in Playwright: plain columns 640px
   wide in a band that bleeds (688px) stay side by side with the document at sm. It happens
   in every inset (the page shell, a card, a band) when the collapsing layout is the inset's
   own item. One inside another layout, such as a component block's wrapper or a stack,
   measures that box and is right. There's no one-line fix: no box is as wide as the line.
   `line.spec.ts` has no columns-in-a-band case yet. Collapsing by a layout's own width (an idea
   under Deferred) would fix it too. Until then: put the columns in a stack (examples under
   "For the docs"). Fine for now (decided with the user, 2026-10-03).
6. **A panel on a short screen** (found 2026-10-03; decided with the user and done the same
   day). `SfPopover` listed six places to try, and Chrome tries only five, the fewest the spec
   allows ("Applying Position Fallback"; proved on a bare page: a list of five reaches its last
   place, six doesn't). So its last place, which scrolls, never applied: on a screen too short
   for a panel above or below its button, it ran off the bottom. Older Safari's script followed
   the whole list and scrolled there instead.
    - **Decided:** drop the scrolling place and let the page scroll instead, as Chrome already
      did. A panel is never taller than the screen less its button, so it fits once its button
      reaches a screen edge. Where it fits nowhere, it stays where it last fitted (else below),
      and scrolling the page brings it into view (not at the very end of a page, below).
    - **Rejected:**
        - Dropping another place. A panel would centre on its button in one more case, or wide
          panels on phones would open above.
        - A list for each direction. CSS has one list per box. A box lined up with its button's
          edge that has to slide counts as not fitting, so only centred boxes could split off.
        - The height limit with Chrome sliding the panel up onto the screen. It does that only
          on a page that doesn't scroll.
    - **Where nothing fits, Chrome** (measured; the script now does the same):
        - keeps the last place that fitted, else its first;
        - slides the panel onto the screen at the sides and the top (above, it can cover its
          button), but lets it run off the bottom unless the page doesn't scroll.

        While the page scrolls, it goes back to the first place that fits.

    - **Room past the end** (decided with the user): while writing, the page scrolls on until
      its last line sits under the editor's top bar, as code editors do, so there's room below
      any button. The footer follows the content, then stays at the bottom of the screen
      (`App.vue`, only while an editor is editable). The bar's height comes from the theme, so
      the bar publishes it while it's shown.
    - **New names** (approved by the user): `fitScreen` in `useAnchorFallback`'s placement:
      tooltips have no height limit, so the script needs telling which boxes do.
      `--editor-top-bar-height`, set by `EditorTopBar`. `app-end` and `app-footer` in `App.vue`:
      the footer, and the box around it that holds the room past the end.
    - **Code review** (`/code-review high`): ten findings, checked.
        - Fixed: the script also watches the page's height. Where a panel fits nowhere it's
          slid up only on a page that doesn't scroll, so a page that starts or stops scrolling
          while it's open has it placed again. Proved in Chrome at 1440×330, the page made to
          stop and then start scrolling with the button still: the script lands where Chrome
          does both times (slid up to 146–330px, then below at 188–372px); without the fix it
          stayed below both times, off the bottom of a page that couldn't scroll. Checked by
          `anchorFallback.spec.ts`, which fails without the fix.
        - Fixed: the new names above weren't flagged. A panel at its full height fits once its
          button reaches the screen's edge (within the gap), not nears it.
        - Logged, left as is (decided with the user): a panel too tall for the room above and
          below its button, at the very end of a page other than the editor, runs off the
          bottom where the page can't scroll to it. Proved in Chrome at 1440×330: it ended at
          380px with the page at its end. Chrome already did this; Safari before 26 shrank it
          to fit and scrolled it, so there it's new. Today only the admin list's last rows, on
          a short screen. If it's needed: every page gets the room past its end while a panel
          is open (closing it after scrolling into the room jumps the page back).
        - Logged: on a right-to-left page, a panel wider than the screen that fits nowhere
          keeps its left edge on screen from the script, its right (start) edge in Chrome (bare
          page, 300px screen: 0–500 against −200–300). The older centring (`slid`) does the
          same and predates this. The site has no right-to-left pages.
        - Not real: no page locks its scrolling. The editor always ends in an empty paragraph
          (TipTap adds one back; checked in Chrome) with the app's line height under both
          themes, so the room's `1lh` matches. When a phone's bar hides, only the room's
          length changes (not checked on a phone). The repeated measuring re-reads an
          unchanged size, so the page isn't laid out again.
        - After the fixes: `anchorFallback.spec.ts` and `app.spec.ts` pass (22); a review of
          the fixes (`/code-review low`) found nothing.
    - **Checked:**
        - `anchorFallback.spec.ts`: a panel on a short screen with its button at the top, the
          middle and the bottom in turn, and a wide one at 400px, land the same with the CSS
          and the script at every step. A panel taller than the screen stops at its height and
          scrolls.
        - `app.spec.ts`: in the editor, the page scrolls until the last line sits under the
          bar, with the footer at the bottom; a published page has no room added.
        - The user, in Safari 18.3.1: right.

7. Bigger: the validator / linter (item 11); WebKit in the layout checks.
8. **Settings for every selected block** (proposed 2026-10-03, not designed): with blocks
   selected, the toolbar's settings would change all of them, as in Notion, Google Docs or
   Figma; today it shows none. To decide: which settings show (only those every selected
   block has), how differing values show ("mixed"), and how the class row works when the
   classes differ. Relies on candidate 2's fix: each block changes in place.
9. **Pickers named custom blocks by their ID** (seen 2026-10-01; fixed 2026-10-04): Change
   Type, Wrap In, Insert and Wrap selection showed a custom block as e.g. "535f350e-…", and
   six built-in blocks by their type's name ("table", "listItem", "taskItem", "tableRow",
   "tableCell", "tableHeader"). They took a block's name from `NODE_META`, else its type's
   name, which for a custom block is its ID (`blockNodeEntries`).
    - **Fix:** the fallback goes through `getNodeAlias` (`nodeRegistry.ts`), as the node path
      does, so a custom block shows its alias ("layout-section", its tag in the code view).
      `NODE_META` names the six (approved): List Item, Task Item, Table, Table Row, Table
      Cell, Table Header.
    - **Checked:** in Chrome, every picker on lists, to-do lists, tables, rows, cells and
      Sections; the six icons draw from the font. `editor.spec.ts` checks Wrap In and Insert:
      it fails without the fix (the IDs) and without the six names ("taskItem"); passes (18).
    - **Logged, predates:** the node path shows built-in blocks by their type's name
      ("bulletList", "tableRow") where the pickers say "Bullet List".
10. **Names when the component store comes** (decided 2026-10-04, not designed): saved pages
    keep only a block's ID; the name is looked up, in one place (`nodeRegistry.ts`), only
    where it's shown. Today the node path, the slash menu and the pickers each find it their
    own way. To decide with the store: a `name` on each component (the store's planned
    field) beside the site's alias, and where each shows (the author's name can be shared by
    two components; the alias is unique on the site). The picker's rows are told apart by
    their label (`ToolbarNodePicker.vue`), which two components named alike would break:
    key them by type.
11. **Typing logged editor warnings** (seen 2026-10-01; fixed 2026-10-04): typing in a
    paragraph or heading straight on the page logged 38 TipTap warnings a letter ("setNode()
    only supports text block nodes"). Not in a Section, as first noted: there the toolbar acts
    on the Section. Change Type's list is worked out on every keystroke, open or not, and for
    a text block it dry-ran TipTap's `setNode` for every block type. `setNode` makes text
    blocks only, and warns for the 19 others.
    - **Fix:** ask `setNode` only about text block types (`defaultItemsBlock.ts`). It's the
      command's own first check, so the lists are unchanged.
    - **Checked:** in Chrome, Change Type's rows on a paragraph and a heading straight on the
      page, a paragraph in a Section and in a to-do item, and a code block are the same before
      and after, on the test page and the demo. Typing anywhere logs none. `editor.spec.ts`
      checks that typing in a paragraph logs no warnings from the app's code: it fails without
      the fix (154) and passes (20). Since 13, a closed menu works out nothing, so the check
      opens Change Type on the paragraph and types with it open: it fails without the fix (133).
    - **Logged, predates:** the menus rebuild their lists on every keystroke (fixed, 13).
      Chrome warns that the preloaded icon font (`index.html`) isn't used within a few seconds
      of the editor opening; not looked into.
12. **The toolbar's context should carry its block's place** (logged 2026-10-04, not
    designed): `ToolbarItemContext` holds the block and its depth, but not its position or
    parent. So the block tools find them again: `resolveActivePos`, called 14 times in
    `defaultItemsBlock.ts` and `defaultItemsShared.ts`. For an image or another leaf block,
    that lookup lands one level short, and `resolveActivePos` patches it with a Proxy that
    fakes the answer. Carrying the place once would remove the Proxy. It touches every block
    tool, so it needs its own sign-off and checks. Found while fixing 11; no bug seen from it.
    - **It would also let the toolbar follow a block's own control** (17): while the code block's
      language picker has focus, the toolbar could show the code block without the cursor
      moving. Today the toolbar can only follow the cursor, and moving the cursor for it either
      lands between blocks or selects the block (typing then replaces it). Worth designing with
      the component store, when blocks with controls of their own are common (logged with the
      user, 2026-10-06).
13. **Menus rebuilt their lists on every keystroke** (found 2026-10-04; fixed 2026-10-04):
    Change Type, Wrap In, Insert and Wrap selection rebuilt their lists after every change in
    the editor, even while closed. A typed letter or a cursor move counts; one arrow press is
    two changes. Each list checks all 22 block types against the toolbar's block.
    - **Why:** the toolbar refreshes every tool after any change, as any change could move it
      to another block (`FloatingToolbar.vue`: `tick` goes up on every transaction, which
      makes a new context). A closed menu kept its rows in the page, worked out from the
      context (`ToolbarNodePicker`): after one letter, Change Type held 4 and Wrap In 9. A
      letter built them twice: TipTap's Vue editor tells Vue about every change again two
      frames later (its reactive `editor.state`, which the lists read). Proved in Chrome: with
      that swapped for a plain holder in the page, a letter built them once, and an arrow press
      once instead of three times.
    - **Cost:** small. In a profile of 20 letters, a letter took 5–7 ms of script, the lists
      0.4–0.6 ms of it. It grows with the component store: each component is one more type in
      every menu.
    - **Fix:** a menu's list is drawn, and so worked out, only while the menu is open
      (`ToolbarNodePicker.vue`). One component, so all four menus. An open menu still follows
      edits.
    - **Checked:** in Chrome, every menu (a paragraph by its crumb and by the cursor, two
      paragraphs selected, a to-do list), with room below and without, at 1440 and 400, placed
      by the browser and by `useAnchorFallback`: place, size and rows are the same before and
      after (64 cases). Change Type's rows are unchanged on both pages. The lists are gone from
      the keystroke profile (about 4.2 ms a letter). `editor.spec.ts` checks that typing leaves
      the closed menus empty, then that Change Type opens with its rows: it fails without the
      fix (13 rows) and passes; the whole suite passes (106).
    - **Logged, predates:** TipTap's second notice reaches everything that reads the editor
      (an open menu, the toolbar's buttons, the node path), so each updates twice per change.
      Harmless; it's TipTap's design. The scroll hint (`ToolbarScrollHint`) reads where the
      node path sits after every change, which makes the browser lay out the page there and
      then. The profile puts 1–2 ms a letter on it, the biggest single item, but some of that
      layout the browser would do anyway before drawing; not looked into further. Why an arrow
      press is two changes isn't looked into either.
14. **Undo after opening a page emptied it** (found 2026-10-03; fixed 2026-10-06): opening a
    stored page, the demo or the test page and pressing Undo before any edit left an empty page,
    for Save to store. The editor was made empty and the page put in afterwards as an edit
    (`setContent`), which undo recorded. Also, a stored page's editor could be typed in before the
    page arrived, and the page then replaced the typing.
    - **Fix, at one boundary:** `TiptapEditor.vue` takes what it opens (`content`, a new prop,
      approved) and puts it in as the editor is made, before anything can be typed, outside the
      undo history and without a "content changed" notice. Callers never load content into an
      editor. Content that fails TipTap's check isn't opened ("This page can't be opened."):
      unchecked, TipTap opens what it can read, which for an invalid stored page is nothing. The
      view (`TiptapEditorDemo.vue`) works out what the address opens before making the editor,
      and says so instead when there's no such page, it can't be fetched, or it isn't a
      document. The store's `loadPage` is gone: `fetchPage` and `setPage` (approved); a page's
      details are set when its editor reaches the store, so a refused page's never are.
    - **Rejected:** a flag at each place content was loaded (the user: easy to miss later).
      TipTap's own `content` option: its check is for the whole editor (every later insert, the
      code view's switch back), and what plugins add on the first change (the trailing paragraph,
      heading classes) becomes the first undo (proved).
    - **The editor reads all the HTML it writes** (decided with the user: fix it at the source).
      TipTap's check refused our own HTML (a table's `tbody`, the video's box) though the same
      page passed as JSON: TipTap's extensions write wrappers they don't declare. Declared: the
      table's `tbody` and `colgroup` (`contentExtensions.ts`), the video's two boxes
      (`youtubeExtension.ts`), and the to-do item's text, read from the div after its tick box
      (`customTaskItem.ts`). That rule replaces TipTap's: its own from 3.30 reads the first div
      anywhere in the item, losing text before a Div block (proved). The check now flags nothing
      in the demo, the test page, the editor's own HTML or the code view's. Everything reads as
      before, except that pasting a to-do list no longer adds an empty span (proved). Upgrading
      TipTap wouldn't do it: 3.31.4 still lacks the table's and the video's (issue #6424).
    - **Checked:** in Chrome, the demo, the test page and stored pages open with nothing to undo,
      and typing then undoing returns to the page. Missing, unfetchable, invalid, non-JSON and
      `null` pages show their message, with no editor or Save. Saving a new page from a
      collection keeps the same editor and tags it. `editor.spec.ts` and `app.spec.ts` gain four
      checks (undo goes no further than the page as it opened, on the test page and a stored
      page; a pasted to-do list matches the one copied; pages that can't open), all failing with
      the change reverted; the suite passes (114).
    - **Reviewed** by two separate agents: the approach (alternatives built and measured), then
      the change. Fixed from the second: the fetch-failure check passed for the wrong reason;
      unreadable stored content said "couldn't be loaded" (now "can't be opened"); the undo
      checks type and undo a letter first, so Undo is known to reach the editor. Also fixed,
      though it predates: stored content that's JSON but not a document (`null` opened as an
      empty page that Save would store).
    - **Logged, predate:**
        - Copy and paste stores display-only extras on the pasted blocks (classes the editor adds,
          such as `sf` and the to-do item's `sl-split sf-gap-md`, a table's minimum width, a
          video's `auto` size) and loses a video's width limit (`resp` is written on its box but
          read only from the iframe). The code view keeps them.
        - A fetch that never answers leaves "Loading editor…" up: tRPC has no timeout.
        - The video's box rule (`div:has(> div[data-youtube-video])`) relies on rule order: a
          block added later that reads a plain `div` holding a video directly would be stepped
          through. None does.
15. **The code view and undo** (found 2026-10-05; fixed 2026-10-06): the code view replaced the
    page inside the page's editor, so Undo and Save took the code for the page. Undo in the code
    view brought the page back behind the code, and switching back flattened it into one
    paragraph; Undo after switching back put the page's code in as a code block; Save in the
    code view stored that code block. Code the page couldn't read was changed without a word (a
    `marquee` came back as a paragraph).
    - **Fix (decided with the user):** the code view is an editor of its own (`CodeView.vue`):
      one code block, with its own undo, and without the code block's keys (they leave the block
      or make a paragraph, which it can't hold). The page stays underneath, hidden, with its
      undo; its toolbar, drag handle and block path aren't shown. Going in, the store writes the
      page as code (`code`, and `pageCode`: the code the page holds) and the keys go to the code.
      Going out, and on Save, changed code goes into the page as one edit Undo takes back,
      through TipTap's content check, and the keys go back to the page. Code it can't read keeps
      the code view open, naming the tag ("Not saved:" first on Save). Unchanged code leaves the
      page alone, so looking costs nothing (and no longer adds a trailing `;` to inline styles;
      edited code still does, same meaning). A table's `thead` and `tfoot` read as rows
      (`contentExtensions.ts`).
    - **Rejected:** a fresh undo history at each switch: looking at the code would throw undo
      away, and TipTap has no command for it. Keeping the swaps out of undo: an edit made before
      the switch could still be undone after it (proved by the review of candidate 14). Measured
      by the review: one editor swapping its whole state in and out breaks (TipTap's Vue editor
      keeps its own copy of the state: the code vanished on the next command, and the page's
      toolbar and path showed over it); CodeMirror edits code better but adds its HTML language
      and commands packages and its own theming, and typing is already fast (7ms a key on the
      demo, against 11ms in the old view); a textarea loses the highlighting.
    - **Dropped (agreed):** the old code view's toolbar: Format Code (switching back and in tidies
      the code), Delete (emptied the page), Toggle selection. With it went the code-view checks
      on the page's toolbar buttons, the code block's disabled language picker, and
      `escapeHTML`, used only by the old switch. Three packages StarterKit already installs are
      now declared: TipTap's document, text and undo (`client/package.json`).
    - **Reviewed** by a separate agent: the approach and the change. Fixed from it (regressions
      of this change): closing the code view left a dead copy of the code on the page, one more
      each visit (TipTap 3.4.1's `useEditor` swapped a copy in for the box when it closed; fixed
      at its source by item 16); the keys stayed on the hidden page, so in Safari typing after
      switching edited it (proved in WebKit); tables with a head or foot were refused; Enter at
      the end of the code added and took away a line by turns, and Cmd+Alt+C threw. Also: the
      message names the refused element's whole opening tag (a plain `<div>` read as if every
      div were wrong), and says "Not saved" on Save.
    - **Checked:** in Chrome, on the demo and the test page, and the keys in WebKit. Nine checks:
      in `editor.spec.ts`, Undo in the code view, looking and back, changed code and Undo, keys
      after switching, the code block's keys, a table's head and foot, code the page can't read,
      the page's toolbar and path, and every switch checks the keys and leaves no copy; in
      `app.spec.ts`, Save in the code view, refused and then saved. All fail with the change
      reverted, and each review fix's check fails with that fix taken out. The suite passes
      (132).
    - **Logged, predates:**
        - Switching back still drops without a word what isn't an element: attributes the page
          doesn't know (`data-*`, `title`, `lang`, `onclick`), HTML comments, and a line break
          before bare text at the top (it becomes a space). Only elements are refused.
        - `FloatingEditorMenu.vue` isn't used anywhere (only registered for auto-import).
    - **Logged, minor:** the code view sits flush under the top bar (the old one had the
      language picker above it); keys typed on the page in the moment the code is being written
      (about 0.1s) aren't in the code, and are replaced (undoably) only if the code is then
      edited; with two refused elements the message names the last; Tab could indent in the
      code view (TipTap's `enableTabIndentation`), but then Tab no longer leaves it. The review
      installed Playwright's WebKit (`~/Library/Caches/ms-playwright`, `webkit-2359`,
      `ffmpeg-1011`): kept (decided with the user), for item 7's WebKit layout checks.
16. **TipTap 3.31.4** (2026-10-06, from 3.4.1; the user wanted the upgrade anyway): TipTap's own
    fix for the dead copy. 3.4.1's `useEditor` swapped a copy in for the editor's box as it
    closed; where the box was the component's own element, Vue removed the original and the
    copy stayed. Besides the code view (candidate 15), a collection's sheet kept the page before
    above the next one while that loaded, or above "Page not found." (proved). 3.31.4 drops the
    copy (TipTap PR #7753) and leaves the box to Vue.
    - **What it broke, fixed (approved):**
        - Closing an editor empties its box at once, so a sheet sliding away showed nothing
          (proved: 675 characters before, none as the slide began). Every editor is made with
          `useEditor` (`composables/editor/useEditor.ts`): TipTap's, except that closing leaves
          a still, inert copy of the page inside the box, which Vue removes with the box. A
          lint rule refuses TipTap's (`client/eslint.config.js`). `CodeView.vue` uses it too,
          no longer making its own editor.
        - Tables were drawn in a box of the editor's own (`div.tableWrapper`), on published
          pages too, so the table wasn't the block and no longer filled its column (238px of
          245 on the demo). Drawn as saved again (`View: null`, `contentExtensions.ts`).
    - **Accepted:** a to-do item's label now holds its tick box's name as hidden text ("Task item
      checkbox for …"; the box had it as `aria-label` already). Saved HTML is unchanged. One check
      reads the item's text after the tick box instead; the demo snapshot's span lines changed.
    - **Rejected:** keeping a sheet's content until it has slid away: the editor is what empties
      a box Vue still owns, so every animated container would need it. The copy swapped in for
      the box, as 3.4.1 did: that is what stayed behind.
    - **Logged:**
        - TipTap's placeholder marks the last empty paragraph `is-editor-empty` when a page
          opens: it reads `editor.isEmpty` before the change applies. Nothing styles that class;
          the demo snapshot has it.
        - TipTap's injected base styles stay after the last editor closes (its closing sees the
          copy as an editor). The copy needs them while it shows; they style only TipTap's
          classes, and the next editor reuses them.
        - Four declared TipTap packages aren't imported: table-header, table-row, task-list,
          dropcursor (`client/package.json`).
        - The copy reloads what's embedded: a sheet's YouTube video stops as the slide begins
          and loads again in the copy (as 3.4.1's copy did).
        - A table cell's `text-align` is now also its own `align` attribute: taking it out of
          the cell's `style` alone leaves the cell aligned (read in TipTap's code).
    - **Reviewed** by a separate agent: the approach holds. Measured: the original page can't be
      kept instead of a copy (destroying takes every node view's content out of it); every
      mounting mode empties or removes the page; the sheet keeping its content until it has slid
      away, or closing the editor once its box has gone, works per container or leaves a live
      editor on screen. Fixed from it (regressions of the upgrade):
        - A to-do item with a class of its own lost its tick-box-beside-text layout as soon as
          it was typed in, ticked or selected, and ticking it dropped its selection highlight:
          TipTap's update now writes the item's own attributes over it (extension-list 3.15.2).
          `customTaskItem.ts` keeps the class as drawn when it updates in place.
        - Tables from elsewhere carrying `<col width>` were saved at those widths (3.31.4 reads
          them), wider than their column. A cell's width is its own `colwidth` again
          (`contentExtensions.ts`).
        - `useEditor` destroys an editor without a view too.
    - **Kept (decided with the user):** TipTap's new keys. Tab at the start of a paragraph right
      after a list moves it into the list's last item (ListKeymap 3.30.0); Backspace at the start
      of a later list item lifts it out of the list before merging (3.25.0).
    - **Logged, predate:** leaving the editor logs a TipTap error: `FloatingToolbar.vue` reads the
      closed editor's page when it goes (3.4.1 threw the same). `useCollapseBreakpoint.ts`
      throws on every collection page: its first run calls `stopWatch` before it's set.
      `useNodeViewInteractions.ts` logs debugging lines, and clicking the demo's first paragraph
      warns about a selection in the document itself. All fixed (17).
    - **Checked:** typechecks; the lint rule refuses TipTap's `useEditor` and allows ours (linted
      in memory, nothing fixed). In `app.spec.ts`: a page closed in a sheet still shows as it
      slides away (fails with no copy), and another page opened in the sheet leaves nothing of
      the one before (fails with the copy swapped in for the box). In `editor.spec.ts`: a to-do
      item with a class of its own keeps its layout typed in and ticked, the selection check
      ticks it too, and a table written with column widths comes back without them (each failed
      before its fix). The demo snapshot's table lines are unchanged from 3.4.1 (fail with
      TipTap's table view). The suite passes (140).
17. **Console errors and debug lines** (logged in 16 and before; fixed 2026-10-06, chosen with the
    user). Each reproduced in Chrome first.
    - **A collection opened once the theme had loaded threw** (`useCollapseBreakpoint.ts`). The
      sheet's narrow-screen switch waited for the theme, then stopped waiting from inside its
      first run, before the stop existed. It now follows the theme's breakpoint: set up when the
      breakpoint arrives or changes, tidied away by Vue with the component.
    - **Leaving the editor threw a TipTap error** (`FloatingToolbar.vue`). The toolbar took its
      room (`has-floating-toolbar`) off the page after the editor had closed. The toolbar's
      extension puts the class on the editor instead (`floatingToolbarExtension.ts`, a
      ProseMirror `attributes` prop), so it comes and goes with the editor.
    - **Focus on a block outside its text put the cursor between blocks**, where text can't go
      (ProseMirror warns the first time on a page). `useNodeViewInteractions.ts` moved the cursor
      to just before a block whenever focus landed on it outside its text, on purpose since Feb
      2025 ("technically an error", `a42a7a4`): so the toolbar would move to a block whose own
      control (the code block's language picker) took focus. Removed, with the debugging lines.
      Measured in Chrome with it switched off: the first click into a block's text ends in the
      same place; a click beside a Card's text still selects the Card (its own click does).
    - **Using a block's own control now leaves the cursor where it was**, and the toolbar on its
      block. Measured on the code before this item: from a layout block's text (most of the demo)
      the toolbar never followed the picker, as another handler in the same file put the cursor
      straight back; only from text straight on the page did it follow, by the cursor between
      blocks. The picker changes its own block either way. Focus on a control and the editor's
      cursor exist side by side; the toolbar reads the cursor (candidate 12).
    - **Tried and taken out** (decided with the user): `FocusSelectsBlock`, selecting the whole
      block while its control has focus. It made the toolbar follow every time, which it never
      had, and the caret handler needed a focus rule so as not to put the cursor back (that rule
      then broke the demo's interactive block, whose text slot can't take focus). With the block
      selected, typing after Shift+Tab back to the page replaced it. The way to have the toolbar
      follow a block's control is under candidate 12.
    - **The pink mode key** (Ctrl+Shift+K) was registered by each dark mode switch (nav and
      footer): the second was refused with a log line, and either one going would have taken the
      key. Both are always shown, so only the line showed. The app registers it once (`main.ts`).
      The plugin's way for a component to register a key (`AddKeyCombo`, `RemoveKeyCombo` and
      `injectSafe` in `symbols.ts`) had no users left: removed, with `removeKeyCombo` (decided with
      the user). Keys for the whole app are registered once at startup; a key for a component while
      it's shown is designed when one is needed (each registration removing only itself).
    - **Debug lines gone:** the dark mode switch's, an empty one in the map demo's marker click, and
      the place picker's coordinates. Kept: a failed query's report (`queryClient.ts`), the key
      plugin's refusal, pink mode's own messages.
    - **Reviewed** three times by a separate agent: the breakpoint, the toolbar's class and the
      pink mode key are at the right place (checked in Chrome: one listener per sheet, removed on
      leaving, following a changed breakpoint; the class kept across updates and the code view).
      Its findings on the focus handler led to the two bullets above; the last pass found nothing
      blocking and confirmed the old behaviour by putting the old handler back. Done from it: the
      editor-change watch unsubscribes through its cleanup; the check measures the toolbar's room,
      not the class; helpers for moving between pages and for what the app logs (`moveTo`,
      `appMessages`); a note on the toolbar's CSS pointing to the extension; a check for the
      interactive block's slot. Left: the sheet keeps its last narrow or wide state if a theme
      drops its breakpoint (the old code never followed the theme at all).
    - **Logged, predates:** typing after a click in the demo's interactive block's text slot does
      nothing. The slot is `display: contents` (`nodeViews.ts`, in a layout with a gap), so it can't
      take focus: the block's box takes it, which is not editable at rest (`decorative`,
      `customComponentNode.ts`, whose comment expects the slot to take focus). The cursor still
      follows the click into the slot. Seen by the review; checked in Playwright.
    - **Checked:** typechecks. `app.spec.ts`: opening a page logs nothing, and the pink mode key
      works; a collection opened once the theme has loaded logs no errors. `editor.spec.ts`:
      leaving the editor logs no errors, with the page's room for the toolbar; clicking between
      the blocks in an inset Card selects it, with no warning; using a block's own control leaves
      the cursor where it was; a click in the interactive block's slot puts the cursor there. Each
      fails without its fix (also the toolbar's room without the extension's class); the slot
      check, which passes on the code before too, fails with the focus rule tried above. In Chrome:
      home, a collection, the editor, a click into a block, beside a Card, the code block's picker,
      leaving: nothing logged. The suite passes (150; on battery, two workers: four time out).

Also seen 2026-10-02: a plain `sl-center` directly in an `sl-inset` (a grid) shrinks to its
text instead of being a reading column: one sentence measured 242px at 1440 (checked in
Playwright, 2026-10-02). Grid items with auto side margins shrink to fit. Nothing in the app
does this: the Centre block's wrapper is the inset's item, and only `LayoutCenter.vue` wears
`sl-center`. Found 2026-10-02, not fixed. Moving between two editor addresses
kept the page open (found 2026-10-01; fixed 2026-10-03, see "Editor + Vue components").

On a narrow window the floating toolbar differs between browsers (seen 2026-10-03). Chrome
starts it at the block and cuts its last tools, which scroll. Safari slides it left so they
all show. Its script measures the toolbar's width, which Chrome limits to the room right of
where it starts. Left as is (decided with the user).

**Layout checks** (added 2026-10-01): `pnpm test:ui` runs
`client/e2e` with Playwright in the installed Chrome, against the dev server. 90 checks (14 of them
expected to fail), about a minute. On battery, four at once get throttled and time out
(2026-10-03); `pnpm test:ui --workers 2` passes.

- **The stylesheet** is built from the seed in a throwaway database in memory
  (`e2e/globalSetup.ts`, using `e2e/d1Memory.mjs`, which the component preview now imports
  too). The run notes when your local database serves something different.
- **Theme independence.** Every check runs under the root theme and again under a test theme
  that differs on purpose (`e2e/testTheme.ts`: twice the spacing, a wide page margin, another
  font, divide lines as a shadow). It exists only in that throwaway database.
  `theme.spec.ts` fails if the test theme stops differing.
- **The checks state behaviour, not looks.**
    - A component block is compared with a plain twin.
    - Each collapse case names the box it measures, and is checked to measure it and to stack
      exactly when that box is at or below its breakpoint (read from the stylesheet).
- **The demo page** is snapshotted under the root theme only (`e2e/__snapshots__`).
- **The cases** are on `/editor?seed=tests` (`client/src/config/editor/testContent.html`).
  Add a case for each layout fix.
- **Known not to work yet** (K1–K5, `e2e/known.spec.ts`): each checks what should happen and
  is marked as expected to fail, with a normal check that every case is set up as described.
  When one is fixed, Playwright reports "expected to fail, but passed": remove its
  `test.fail()` and move the case up the test page.
- **Proved against old stylesheets** (`SF_SYSTEM_CSS=<file>`): the pre-item-10 stylesheet
  fails 19 of the 25 root-theme checks, and the pre-6b one fails only the toolbar check (plus
  the theme check, since old stylesheets have no test theme).

To try a case by hand first, build it with `editor.commands.setContent(html)`: layout blocks as
`<layout-section|columns|split|center|card|cover>`, plain blocks as
`<div data-container class="…">`, and a component with parts of its own as `<tiptap-test>`.

**Fixed with the checks:** `LayoutCard.vue` used `overflow: hidden`, so a block pinned inside a
Card stuck to the Card instead of the scroll area around it (off by 104px). It now uses
`overflow: clip` with `display: flow-root`. The demo page doesn't move; only the Cards' display
value changes in the snapshot.

**Not yet checked in a browser since 2.86.0:** reseed, then icons (optical
size now follows the font; decide whether in-text icons want `1.1em` in
`material-symbols.css` — rounded glyphs look smaller), spacing in cards, layouts, lists,
task lists, quotes and videos, and the toolbar panel rows (`2xs`).

**The sf/sl migration is largely complete. All class families are seeded (depth, heading, variant, loudness, size, state, layout, context, element markers). Editor chrome is fully on intent-only composition. What remains is either "wait for a consumer" (sf-is-loading, sf-on-active), a structural refactor (layout full migration), or the Vuestic removal track.**

What's in place:

- Theme schema (`api/src/schemas/theme.ts`): `themes`, `theme_tokens`, `class_vocabulary`,
  `class_rules`, `class_rule_classes` — all done. (`user_theme_aliases` and the brand user went
  2026-10-05, as nothing read them: docs/database.md.)
- Layout schema (`api/src/schemas/layout.ts`): `collapse_thresholds(name, value, updated_at)` —
  system config separate from theme tables; user-editable, not wiped on reseed.
- Domain layer (`api/src/domain/`): `themes`, `themeTokens`, `classRules`,
  `collapseThresholds`, `seed` — all done.
- Runtime CSS generator (`api/src/domain/generateCss.ts`): reads all tables at request time,
  emits full stylesheet. Cached in-isolate by `themeSignature`. ETag + `Cache-Control: public, max-age=60`.
  `@layer` order declaration is the first rule emitted (in the HEADER constant) — the
  `<link rel="stylesheet" href="/styles/sf-system">` is synchronous so the declaration fires
  before Vite injects `main.css`.
- Seed (`api/src/domain/seed.ts`): Root/Dark/Pink themes + all tokens + full vocabulary +
  rules for depth/heading/variants/layout/overflow-context. Collapse thresholds seeded idempotently.
- Reseeding: `api/src/domain/seedVersion.ts` exports `SEED_VERSION`; `generateCss.ts` warns on
  a version mismatch and nothing reseeds on its own. `pnpm seed:local` / `pnpm seed:live`
  (`api/scripts/seed.mjs`) reseed; the first-boot seed and `POST /dev/seed` were removed
  2026-10-03.
- `--sf-breakpoint-*` removed from tokens entirely; "breakpoint" term dropped.
  Collapse thresholds live in `collapse_thresholds` table; generator embeds pixel
  values directly in `@container` conditions.
- `sl-split`: `grid-template-columns` removed from scoped CSS — now fully in DB as
  `var(--sl-template, auto 1fr)` so the `@layer sl-layout` collapse rule can override it
  (same pattern as `sl-columns`). Collapse now works on both.

Done (generator slice):

- `api/scripts/generate-css.mjs` deleted; replaced by `api/src/domain/generateCss.ts`
  (TypeScript, runs at request time).
- CSS served at `/styles/sf-system` via Pages Function
  `api/functions_src/styles/sf-system.ts`. Two-layer cache: in-isolate signature cache
    - Cloudflare Cache API (survives cold-starts; `waitUntil` put so first request isn't
      penalised). ETag + `Cache-Control: public, max-age=60` for browser/CDN.
- `generated-tokens.css`, `generated-classes.css`, `generated-editor-classes.css`
  deleted; `<link href="/styles/sf-system">` in `index.html` replaces them. Vite dev
  server proxies `/styles` → wrangler (`:8788`).
- `themeTokensStore` (Pinia) hydrates `themes.list` + `themes.listTokens` at startup
  (fire-and-forget from `main.ts`). Editor palettes derive reactively from `rootTokens`.
- `colorPalette.ts` + generator `classifyTokens`: `var()` semantic aliases (e.g.
  `--sf-primary`) excluded from palette bucket via TRIPLET guard — they are not numbered
  steps and would create phantom shades in the colour picker.

Done so far:

- Spec finalised (slot-label principle, semantic vocabulary, range tokens, alpha
  pairing rationale) — see `sf-system.md`.
- DB schema for themes + tokens + rich-class tables (`class_vocabulary` and
  `class_properties` now hold the `sf-depth-*` family; variants/states still empty).
- Seed data for `root`, `dark`, `pink` themes — includes the new
  `--sf-shadow-opacity` token (theme-character knob; `0.12` at root).
- Three-file generator with property-mapping rules in code, plus rich-class layer
  emission from `class_vocabulary` + `class_properties` (one `@layer` block per
  layer; root defaults + `.theme-X` override rows).
- Cascade layer declaration in `main.css`.
- `.dark` / `.pink` → `.theme-dark` / `.theme-pink` across CSS, JS, Tailwind config,
  and the OS-preference preload script.
- `sf-collapse-*` → `sl-collapse-*` rename (collapse is arrangement, not appearance).
- `sf-depth-{0..3}` bundles — background-only at root (each binds to its matching
  `--sf-surface-N`). Theme colour shifts cascade through the token; no per-theme
  override rows needed.
- `sf-heading-{1..3}` bundles — `font-size` + `line-height` at root
  (1 → `text-4xl`/`leading-tight`, 2 → `text-2xl`/`leading-snug`,
  3 → `text-xl`/`leading-snug`). Same posture as depth: minimal property set,
  add weight/tracking when a consumer argues for them.

Pipeline fixes uncovered while wiring sf-heading:

- **Tailwind preflight was beating `sf-bundle`** — `@tailwind base` was
  unlayered, and unlayered rules always win over any cascade layer. Preflight's
  `h1,h2,h3 { font-size: inherit }` was silently nullifying the bundle. Fix in
  `main.css`: wrap `@tailwind base` in a new `reset` layer declared first in
  the layer order. Tailwind components/utilities stay unlayered so utility
  classes still override sf-\* (intended).
- **`htmlBlueprint.ts` `parseSelector` regex was rejecting hyphenated tags**
  (`va-button`, etc.). Custom-element tags MUST contain a hyphen per the HTML
  spec, but the regex used `\w+`. The code-view toggle was silently failing
  because `initGenerateBlueprintHTML` threw during dynamic-node setup and the
  store's watchEffect swallowed it. Two fixes: regex now `[\w-]+`, and the
  store lazy-inits on first toggle with a try/catch that surfaces errors as
  Vuestic toasts (mobile-friendly — no console needed).
- **Attribute panel was filtering out `class`** (`ToolbarAttributeEditor.vue`).
  The filter was added speculatively ("class tokens cover it") but nodes
  without a `nodeClassTokens` entry lost the ability to edit `class` at all.
  Filter removed — `class` is now editable alongside `style` and `id` for any
  node that has `AllowAttributesExtension` global attrs.

CSS pipeline tightening (f0949af):

- `@layer` declaration hoisted to the top of `main.css` (before the `@imports`).
  The minifier had been reconciling source order, but the source is now spec-correct.
- `vite.config.ts` pins `build.cssTarget` to chrome87/edge88/firefox78/safari14 so
  esbuild keeps `(max-width: …)` syntax in `@media`. `@container` queries still
  emit range syntax `(width<=…)` — esbuild doesn't downgrade those, but Chrome 105+
  is required for container queries either way so it's a non-issue.
- `ColorPicker.vue` null-guards `snapToStep` (returns `AlphaStep | null` since
  a278e15). The missing guard was breaking type-check, which killed the build
  watch; wrangler kept serving the previous good chunks (pre-rename CSS with
  stale `var(--radius-*)` refs that resolved to nothing). When debugging visual
  regressions, always check that `pnpm dev`'s build half hasn't silently failed.

Known gap not in this slice:

- **Saved page content in D1 still carries pre-rename class tokens**
  (`sf-radius-md`, `sf-collapse-xs`, etc.). The CSS no longer defines those
  rules, so existing saved pages render unstyled when loaded by slug. Workaround:
  load with `?seed=true` to open `initialContent.html` instead of the stored
  page. Per-user decision whether to write a migration
  or just reseed.

Done in the editor + cleanup slice:

- Editor migrated to `--sf-*` vocabulary end-to-end: `extractCssVars` reads both
  `base.css` and `generated-tokens.css`, fixes the stale `.dark` / `.pink` selectors
  (Vuestic dark/pink presets were silently empty since the rename — now restored).
- `colorPalette.ts`, `alphaPalette.ts`, `fontPalette.ts`, `layoutTokens.ts`,
  `textColorMark.ts`, `fontStyleMark.ts`, `ToolbarColorControl.vue`,
  `ToolbarFontControl.vue`, `ToolbarCornersControl.vue` all use `--sf-*` prefixes.
  `snapToStep` returns `AlphaStep | null` — the fallback was making up an arbitrary
  "closest to opaque" step that doesn't exist in the new range.
- Component CSS rename: 128 `var(--alpha-N)` references migrated to `var(--sf-alpha-N)`
  across ~25 files. Legacy `--alpha-{0..100}`, `--shadow-{sm..xl}`, `--radius-*`,
  `--text-*`, `--leading-*`, `--tracking-*`, `--spacing-*`, `--font-{sans,serif,mono}`,
  `--breakpoint-*` deleted from `base.css`.
- `sf-tokens.css` reduced from 675 lines to ~25: TipTap reset + the one `sf-bg_secondary`
  class that has live consumers (others were speculative).
- Shadow colour migrated to the class-pair + inline-escape-hatch pattern (matches
  bg/text/border). Generator auto-emits `sf-shadow-color-*` + `sf-shadow-alpha-*`
  alongside the existing colour palette classes. `ToolbarShadowControl.vue` parses
  the picker's output — palette pick → class pair, freeform hex → inline
  `--sf-shadow-color`. Same var name for both paths; inline still beats layered
  classes so the escape hatch survives on top of a palette pick. Existing D1
  content with inline `--sf-shadow-color` (rgb string) continues to render
  correctly — no content migration required.
- `initialContent.html` migrated: `sf-radius-md` → `sf-radius-2`, `sf-radius-none` →
  `sf-radius-0`, then `sf-radius-0` on the full-bleed code block → `sf-is-edge-left sf-is-edge-right`.

### What's intentionally still legacy

- Legacy colours are gone (2026-09-29): their last readers (multiSelect drag preview,
  the logo SVGs, `.sf-bg_secondary`, main.css body) moved to theme classes and `--sf-*`
  tokens. `base.css` holds only app vars (timing, toolbar height, z-index layers).

What's pending:

1. ~~**Held — no consumer yet**: `sf-is-loading` / `sf-is-error`.~~ Both have rules and
   consumers (2.65.0; loading dims like disabled since 2.82.0 — see below). (`sf-on-active`
   and `sf-on-ancestor` have rules and a consumer: SiteNav, v2.71.0.)
2. **Raw token refs in component CSS** — many components still reference `--border_color`,
   `--primary`, `--text_primary` etc. directly. Migrate one-by-one as the right
   vocabulary class is seeded; no bulk pass until the class system covers the gap.
3. **Layout full migration** — the layout class on the node view's content box itself
   instead of a stepped-aside wrapper (see Editor + Vue components). Deferred: layout blocks
   stay Vue node views (user, 2026-09-30).
4. ~~**Legacy colours**~~ — done 2026-09-29 (see above).
5. ~~**Vuestic removal**~~ — done 2026-09-29 (runtime, config, `processTailwindColors`).
   Tailwind removed 2026-09-29: preflight replaced by the theme's reset
   (`api/src/domain/css/reset.ts`); packages, `tailwind.config.js`, `postcss.config.js`
   gone. `extractCssVars` / `cssVariables.js` kept for now with no reader.
6. **Seed batching** — individual `await` per upsert (~160 round-trips). Use `db.batch()`
   if seed time becomes a problem against production D1.
7. ~~**sl layout in the seed / spacing inheritance**~~ — done 2.86.0 (2026-09-30). What
   each `sl-` class arranges is fixed CSS (`api/src/domain/css/slLayout.ts`); the seed keeps
   only looks on `sl-` classes (hidden scrollbar, scroll-frame arrows). `--sf-gap` and
   `--sf-padding` are registered not inherited (`reset.ts`), replacing the zero reset on
   node-view wrappers; compact units got their own padding default; `sl-cover` reads the
   gap. `LayoutCard` lost its second (inherited) padding; `LayoutCenter` wears `sl-stack`.
   `main.css` split: block spacing (flow containers, theme spacing steps, lowest layer),
   node views and the video's default box are fixed CSS in `api/src/domain/css/`
   (`blockSpacing.ts`, `nodeViews.ts`, `embeds.ts`) reading one `GAP_LAYOUTS` list from
   `slLayout.ts`; the icon font setup is `material-symbols.css`; `sf-tokens.css` removed.
   Lists wear `sf` (theme draws `ul.sf`/`ol.sf`), inline content
   icons wear `sf-icon`, the popover colour rule moved to the reset, a responsive YouTube
   video's 16:9 box is a reset-layer default (`embeds.ts`, keyed on a rendered
   `data-responsive` marker) so the aspect control's choice wins.
8. **Found in review 2026-09-30.**
    - **Fixed 2026-10-01:** a to-do item with its own `class` lost `sl-split sf-gap-md` (its
      checkbox went above its text, in the editor and on published pages), and a class
      changed while editing didn't show until reload. TipTap's TaskItem node view set the
      item's attributes over the configured ones and updated only the tick; `CustomTaskItem`
      now merges them as `renderHTML` does, and redraws the item when anything but the tick
      changes. Checks: `blocks.spec.ts` (twin of a plain item) and `editor.spec.ts`. Also
      tried in Chrome: Enter, Backspace, undo, a nested list in a redrawn item, and a
      published page (its server reply swapped in the browser).
    - Not fixed: a code-view round trip stores `sl-split sf-gap-md` as the item's own class
      (the saved HTML carries them and parsing reads the whole class list). Harmless, as the
      item merges them anyway; the same kind of leak as `resp-yt` below.
    - Not fixed (found 2026-10-01, in the document, not the component): Enter in a to-do item
      gives the new item the same class and the same `id`, so two items share an id.
    - Not fixed: saved documents may hold `resp-yt` in a video's class (rendered into the
      iframe before 2.86.0, captured by a code-view round trip); harmless, no CSS uses it.
    - Collapse can shrink a block to zero width. This was checked in Chrome and is now part of
      item 10 (rule 3).
    - **YouTube, older bugs:** pasting a video stores the
      rendered `width="auto"` / `height="auto"` as real attributes (the code view then shows
      them), and loses its `resp` width limit (the iframe never renders `resp`, so paste
      resets it to 36rem).
9. **Open:** the `* { transition }` fade in `main.css` is a look (motion) — a theme token
   would move it to the theme (new vocab, undecided). Spec-linter candidates are collected in
   item 11.
10. **NEXT — rules that reach through a node view (design signed off 2026-10-01; steps 1–7
    done, awaiting review and commit).**
    - **The structure.** A component block is `[data-node-view-wrapper]` (the box the parent
      places) > component root (wears the author's classes) > `[data-node-view-content]` >
      child blocks. This holds in the editor and on published pages; both are TipTap.
    - **What fails, confirmed in Chrome against a plain element as the control:**
        - `sf-divide-*` draws no lines in a section or card block.
        - The scroll frame misses a block.
        - `sl-bleed`, `sl-row` and `sl-pin-*` on a block do nothing.
        - A hidden block leaves a double gap.
        - A block is 0 wide in a cluster, cover, aligned layout, table cell or `auto` column.
        - Top-level elements never hide.
        - A component that is a scrolling cluster squeezes its items.

    **Design: three rules.** Measured with trial CSS in Chrome. The demo page doesn't change
    at full, 600 or 360px; the only size change is a table that now fits its column. The
    floating toolbar, the multi-select drag preview and the site nav swap are unchanged.
    - **Rule 1: rules are written for the content tree, and the generator maps them onto the
      DOM.**
        - One helper, `throughNodeViews(selector, options)`, in
          `api/src/domain/css/nodeViewSelectors.ts`. It imports nothing, and its tests are in
          `api/test/nodeViewSelectors.test.mjs`.
        - `subject` says which element a rule styles: `'wearer'`, the element wearing the
          classes (looks; every theme rule), or `'placed'`, the box the parent places (fixed
          placement CSS: inset items, bleed, a scrolling cluster's items, pin/hide/show).
        - `placementClasses` and `stepAside` come from `slLayout.ts`.
        - Each step splits in two. Position and sibling tests (`:first/last/only-child`,
          `:nth-*`, `+`, `~`) are tested on the box the parent places. Classes, element types and
          the look go on the element wearing the classes.
        - When a layout's content box steps aside, its first block counts as the next sibling of
          the root's last own part. So a decorated component's slot gets its divide line.
        - Inserted tests sit in `:where()`, so weights don't change.
        - The generator sorts and keys on the selector as written and maps only when emitting, so
          alphabet ties don't move.
        - A nested `:has()` throws, because the browser would drop the whole rule.
        - The gap cursor isn't skipped. While it sits before a divided layout's first block,
          that block shows a line. This is brief, and the cursor itself draws nothing.
        - Fixed sl CSS goes through the same helper. `sl-object` is the exception to decide at
          step 3: a content box has no height to fill.
    - **Rule 2: placement classes are worn by the box the parent places.**
        - A content extension adds a ProseMirror node decoration carrying the node's placement
          tokens, so they land on the node view's outer box. This covers every node view, in the
          editor and on published pages, and is never saved. TipTap already binds the wrapper's
          class to decorations.
        - `PLACEMENT_CLASSES` lives in `slLayout.ts` and is exported to the client: `sl-row` and
          `sl-bleed`, plus the prefixes `sl-pin-`, `sl-hide-below-` and `sl-show-below-`.
        - Pin, hide and show act only on the placed box. Row and bleed also act on the root, for
          subgrid and the inset variables.
        - Theme rules that name a placement class get `:where(:not([data-node-view-wrapper]))`, so
          a pinned element's shadow draws once.
    - **Rule 3: width containers.**
        - **Collapse measures the space the block has.** A component block's wrapper is a
          container when the block itself collapses. `sl-` layouts holding a collapse stay hosts;
          plain elements measure the layout around them.
        - **Inside a box sized by its content, nothing measures** (documents only). Queries go up
          to the next box; otherwise that box is 0 wide. `SIZED_BY_CONTENT_SELECTOR` in
          `slLayout.ts` covers:
            - table cells, `sl-cluster` and `sl-cover`;
            - any layout aligned sideways (`sl-align-x-*`, which now includes Section's align);
            - the first column of a split with no `--sl-template` (its `auto` default).

            The check covers every ancestor, not just the parent (cluster → card → section).

        - **Inside documents, hide and show measure the document.** `.tiptap.ProseMirror` is a
          named container (`sf-document`); hide/show inside it query it by name, and layouts there
          don't become containers for hide/show. "Hide below md" means the page is narrower than
          md. App chrome, such as the site nav swap, keeps today's behaviour.
        - **A popover is laid out on its own** (step 6b). What's inside one doesn't make the
          layouts around it measure; inside it, layouts measure as usual.
        - **Nothing else is a container.**
            - Chrome boxes aren't: the fit-content toolbar would be 0 wide.
            - `LayoutCard.vue` loses its own `container-type`.
            - Not every `.tiptap` is: the multi-select drag preview has that class.

    - **Housekeeping in the same change** (done in step 4).
        - The node-view rules move into `@layer sl-layout`; they were unlayered.
        - `sl-inset`'s content box steps aside like the other layouts, so
          `STEP_ASIDE_LAYOUT_SELECTOR` is gone and everything reads `GAP_LAYOUT_SELECTOR`.

    **Order: one file at a time.**
    1. **Done 2026-10-01:** `nodeViewSelectors.ts` plus its tests. 8 tests pass, including that
       every rewrite keeps its weight. In Chrome, its output in place of the hand-written trial
       CSS gave identical results on the demo page (620 elements at full, 600 and 360px) and on
       the divide, frame, bleed and scrolling-cluster cases.
    2. **Done 2026-10-01:** `generateCss.ts` rewrites every theme rule as a look after sorting
       (`forNodeViews`). `PLACEMENT_CLASSES` was added to `slLayout.ts`.
        - A selector the helper can't rewrite is emitted as written with a console warning. The
          seed has none.
        - A descendant step inside `:where()` (`a:where(p *)`) stays as written.
        - Served stylesheet: 592 rules before and after, and Chrome parses all 565 style rules;
          +4.7% bytes.
        - Demo page unchanged at full, 600 and 360px (boxes, borders, overlays).
        - Divide lines now draw in section and card blocks and in a decorated component's slot.
          A quiet card's line moved from its wrapper to the card.
        - The scroll frame's overlays reach a scroll area that is a block. Arrows still need the
          overflow script, which pages don't run (logged).
    3. **Done 2026-10-01:** `slLayout.ts`, `slCombined.ts` and `slObject.ts` route every rule
       with a child or sibling step through `forPlacement` / `forLooks` (shared in `slLayout.ts`;
       the generator's theme rules use `forLooks` too).
        - Inset items, bleed's column and a scrolling cluster's items are placement. A bleeding
          inset's inherited edges and `sl-object` are looks.
        - Pin, hide and show move to step 6, together with the decoration that puts them on the
          wrapper. Doing it earlier would stop them working on component blocks in between.
        - The sized-by-content list goes with step 5.
        - Checked in Chrome: 592 rules, all parse; demo page unchanged at full, 600 and 360px.
        - A Card block set to scroll sideways keeps its items' natural width (465px on one line,
          was 420px on two).
        - An image in a Card set to cover fills the card (was spilling out at its own height).
        - Bleed inside a card used as an inset needs step 4.
    4. **Done 2026-10-01:** `nodeViews.ts`, `blockSpacing.ts` and `slLayout.ts`. An inset's
       content box steps aside, `STEP_ASIDE_LAYOUT_SELECTOR` is deleted (the helper's
       `stepAside` is `GAP_LAYOUT_SELECTOR`), and the node-view rules are in `@layer sl-layout`.
        - Checked in Chrome: demo page unchanged at full, 600 and 360px, including every box's
          display and container type.
        - Bleed inside a card used as an inset reaches the card's edges (1326 of 1326, was
          1294).
        - Spacing between blocks in an inset block stays 16px (now the gap, was margins).
        - Clicking in an inset block's gap selects the block, as for a Section (it used to place
          the text cursor).
          4b. **Done 2026-10-01: alignment.** On every layout, x is sideways and y is up and down.
        - Before, on a stack `sl-align-y-*` moved items sideways and `sl-align-x-*` did nothing.
          Now a stack aligns sideways with `align-items` and up and down with `justify-content`,
          and a cluster aligns sideways with `justify-content` (`slLayout.ts`).
        - New class `sl-align-x-center`. Seed descriptions corrected; seed 2.87.0, reseeded.
        - LayoutSection's `align` is now a class instead of an inline style, so CSS can see it.
          Saved pages are unchanged (they store `align`).
        - Spec alignment table updated.
        - Checked in Chrome: demo page unchanged at full, 600 and 360px. Site nav, toasts and
          TiptapTest's decoration row are unchanged.
        - Follow-ups:
            - `PromptModal.vue`, `StackableSheet.vue` and `TiptapCodeBlock.vue` have comments
              saying `sl-align-x-*` is grid-only. They could now use `sl-align-x-end`.
            - LayoutColumns and LayoutSplit still write their `align` (up and down) as an inline
              style. That's harmless, but it isn't a class.
    5. **Done 2026-10-01:** rule 3 containers plus ideas A and B. Files: `generateCss.ts`
       (collapse layer), `nodeViews.ts`, `slLayout.ts` (`SIZED_BY_CONTENT_SELECTOR`,
       `SWAP_CLASS_SELECTOR`), and `LayoutCard.vue`, which loses its own `container-type`.
        - The document is a named container (`sf-document`).
        - A wrapper is a container only when its block collapses.
        - A layout becomes a container for a collapse anywhere, and for a swap only outside
          documents.
        - Inside a document, hide and show query `sf-document`; elsewhere they query the
          nearest container, as before.
        - Idea A covers documents only: in app screens, popovers sit inside rows. The
          Attributes panel's class row, inside the toolbar's cluster, stopped stacking when A
          applied everywhere.
        - Checked in Chrome:
            - Demo page: column counts unchanged at full, 600 and 360px. The only size change is
              the Lists / Tables row: the table used to overflow its 229px column, and the column
              now fits it at 238px.
            - Cases A1–A5, B1, T1, S1, C1, C2 and H1 all fixed or kept (see the design results).
            - A centred Section with columns now stacks instead of vanishing.
            - The site nav swap and the open Attributes panel are unchanged.
    6. **Done 2026-10-01:** placement classes on blocks.
        - The list lives in its own import-free file, `api/src/domain/css/placementClasses.ts`
          (with `isPlacementClass`), exported as `@somefreq-app/api/placementClasses`. That's
          the client's first runtime import from api, and the generator stays out of the client
          bundle. Moved the same day to `shared/placementClasses.js` (`@somefreq-app/shared`,
          plain JS beside its types): importing it from api's build made the client's build
          wait for the api's, and the first deploy of main failed on that race.
        - `client/src/editor/extensions/placementClasses.ts` (`PlacementClasses`, in
          `getContentExtensions`) adds a node decoration with the node's placement tokens. The
          decorations are rebuilt only when the doc changes.
        - Pin (`slLayout.ts`) and hide/show in documents (collapse layer) go through
          `forPlacement`. Row and bleed apply as before.
        - The helper now sees that `:is()` / `:where()` naming a class rule the wrapper out
          (9 tests).
        - Checked in Chrome:
            - wrappers get the tokens; saved JSON unchanged; `ProseMirror-selectednode` kept
              alongside;
            - pin sticks (0 from the scroll area's top after scrolling 120, was −120);
            - a hidden card leaves a 16px gap (was 32);
            - a row's cells line up with the parent's 3 columns (were all in the first);
            - bleed reaches 1326 (was 1278);
            - demo page unchanged.
        - Not checked on a published page (same extensions, so expected to match).
          6b. **Done 2026-10-01: toolbar.** A popover is laid out on its own, so what's inside one no
          longer makes the layouts around it measure; inside a popover, layouts measure as before
          (`hostsFor` in the collapse layer).
        - Fixes the node toolbar that shrank to its handle: 878px with every tool, was 52px with
          826px hidden.
        - The open Attributes panel is unchanged: its class row stacks in the 300px panel.
        - Site nav swap and demo page unchanged.
    7. **Done 2026-10-01: the spec** (`sf-system.md`).
        - "Container-responsive collapse" rewritten: what each box measures, content-sized spots,
          popovers, hide/show in documents. The line saying a typed `sl-columns` in a split
          measures its own space is gone; the typed-layout limit is stated instead.
        - "Editor integration" gains "Component blocks": the three boxes, how rules are
          rewritten, placement classes on the outer box, and the component rules.
        - New "Validator and linter (not built)" section, which replaces item 11's list.
        - The side-margins limit "a block can't be a direct child of an inset yet" is gone.
        - Two corrections, checked in Chrome: a named container still answers unnamed queries
          and is still 0 wide in a row, so the component rule says to avoid width containers
          and name any you add (the lint candidate was "no unnamed container on the root").
          `overflow: hidden` around a pinned element stops it sticking (−120 vs 0 with `clip`).
          The sibling-rule lint candidate was dropped: the helper handles `.x + .y` between
          component blocks.

    **Open, decide when reached:**
    - Names approved: `nodeViewSelectors.ts`, `throughNodeViews`, `forLooks` / `forPlacement`,
      `PLACEMENT_CLASSES`, `SIZED_BY_CONTENT_SELECTOR`, `sf-document` and `PlacementClasses`.
    - Resolved: Section's align is a class (step 4b). The `auto` split column is spotted by the
      missing inline `--sl-template`, as agreed.

    **Known limits, to document:**
    - Typed layouts measure the layout around them; layout blocks measure their own space. In a
      narrow split side, a typed grid stacks only when the whole split is narrow. Check K1.
    - A component whose own CSS sizes its slot by content, without `sl-` classes, still makes a
      collapsing block inside it 0 wide. In the component rules and the validator section.

    **Component-creator contract, for the spec:**
    - Render one root element and let attributes fall through (Vue's default).
    - The blocks are your root's items only if `<slot />` is a direct child of it.
    - Don't bake placement classes on your root; give the node a default class.
    - Use a named container for your own width rules.
    - Prefer `overflow: clip`.

    **Alternatives ranked worse:**
    - Layout blocks as one-box nodes: rejected. It makes two kinds of block and loses
      selecting a block by clicking outside its content.
    - Classes on the content box: rejected.
    - Separate HTML for published pages: two paths, and the editor still needs the fix.
    - Copying classes onto the wrapper from code: a Vue class binding would clear
      ProseMirror's selection class. Decorations are TipTap's own path.
    - The wrapper as `display: contents`: this removes rule 2, but the wrapper's rect becomes
      0×0, and the drag handle, floating toolbar, block menu and drag image all read it.
    - Every wrapper a container (today): blocks vanish in content-sized spots.
    - Chrome boxes as hosts.
    - Own-width collapse by grid maths: equal columns only, and it can't express a split.

    **Logged, outside this change** (found in review; these predate it):
    - ~~App screens: with a block selected, the floating toolbar shrinks to its handle.~~
      Fixed in step 6b.
    - ~~`vue-tsc` reports TS6307 for `client/src/components/siteNav.ts`.~~ Fixed 2026-10-01:
      the name clashed with `SiteNav.vue` (they differ only in case, the same name on macOS),
      so the pre-commit type check failed on any client change. It's now `navItems.ts`.
    - `pnpm typecheck` for api fails in a fresh checkout until the api has been built:
      `functions_src` imports `../../dist/…` by relative path, though `tsconfig.check.json`
      says it doesn't need `dist/` (its `@/*` path only helps imports written with `@/`). The
      pre-commit hook passes locally because `pnpm dev` keeps `api/dist` built. Found
      2026-10-01 checking each commit in a clean copy; predates item 10. The client's check
      no longer needs it (2026-10-01): `@somefreq-app/api/appRouter` is types only and points
      at api source (46 errors in a fresh checkout before, 0 after). CI (2026-10-01,
      `.github/workflows/checks.yml`) builds before it type-checks, so the api's check has
      its `dist/`; the order is the workaround, not a fix.
    - Lint and the format check run in CI since the cleanup (2026-10-01): markdown is linted
      as GitHub's (task lists), and .vue files get Vue's recommended rules minus the 11 that
      `eslint-config-prettier` lists as Prettier's (switched off by hand, no dependency);
      `html-self-closing` stays with `void: 'any'`, and `require-default-prop` is off (an
      optional prop is left out, not defaulted to undefined). The layout checks (Playwright)
      stay out of CI by choice (decided with the user, 2026-10-01): they're run locally.
    - `sl-row` or `sl-inset` on a Section or Center loses to its baked `sl-stack`: a Section's
      blocks don't line up with the parent's columns, and an inset Section or Centre has no
      side margins. Checks K2 and K3.
    - A component root doesn't fill its stretched wrapper: a Section with a background in a row
      of columns is 58px tall beside a 394px Card (TiptapTest: 235 of 520px). LayoutCard
      patches this with `height: 100%`. Check K4.
    - TiptapCodeBlock puts the author's classes on a nested `pre`. That node view is editor
      only, so placement and looks differ from published pages.
    - Scroll-frame arrows can't show in documents: the `sf-is-overflow-*` script runs only in
      admin lists and toolbars.
    - Atom components can't be selected by clicking.
    - A hidden last block leaves the previous block's bottom space (plain elements too): 32px
      under the last shown block in a Card instead of 16px. Check K5.
    - The class picker offers only gap, padding, radius and collapse.

11. **Linter / validator (not built).** The rules are in the spec, "Validator and linter (not
    built)"; add new candidates there.

## Schema notes

Three concepts in the DB:

- `themes` (PK: slug). Activation class for non-root themes.
- `theme_tokens` (PK: theme_slug + name). The token vocabulary; `kind` column for
  editor introspection (`color-triplet`, `length`, `number`, `text`, `shadow-shape`).
- `class_vocabulary` + `class_properties` (empty; PK: theme_slug + class_name +
  css_property). Hold rich classes only (bundles, variants, states). Thin-wrapper
  classes (semantic single-property, scale utility, palette utility, alpha pairing)
  are NOT stored — they're derived by the generator from `theme_tokens` + a
  property-mapping list that lives in code.

This split keeps the DB small and makes the editor source-of-truth for "what classes
exist" clean: query `theme_tokens` + apply mapping rules to get the auto-generated
classes; query `class_vocabulary` for the rich ones.

## Foundational

- [x] Declare cascade layers in CSS:
      `@layer reset, ui, sf-bundle, sf-variant, sf-context, sf-semantic, sf-utility, sf-state;`
      `ui` sits between `reset` and `sf-bundle` so component default CSS can be
      overridden by any sf layer. Component `<style>` blocks should be wrapped in
      `@layer ui { }`. The name is `ui` (not `components`) because Tailwind's PostCSS
      plugin hijacks `@layer components` and requires a matching `@tailwind components`
      directive in the same file — using our own name sidesteps that entirely.
- [x] Static `RESET` block — `api/src/domain/css/reset.ts`, emitted by the generator as
      `@layer reset { }`: the page's fixed starting point (replaced Tailwind preflight).
      The other fixed blocks sit beside it in `css/`. Add rules there; no seed bump needed.
- [x] Generator emits all auto-derived classes (semantic canonicals, value-linked
      utilities, editor palette + alpha pairings) inside their matching `@layer`
      blocks. The remaining "wrap in @layer" work is for the **legacy** hand-written
      `sf-tokens.css` sections — those go away with the editor migration rather than
      being wrapped, so no separate layer-wrapping pass is needed.
- [x] Token names — `--sf-*` names are already correct in the DB seed and generated
      at runtime. The legacy unprefixed colours were removed with their last readers
      (2026-09-29), not renamed.
- [x] Rename `.dark` theme class to `.theme-dark` to match the spec's theme activation
      convention. Done across `base.css`, `darkModeStore.ts`, `index.html`,
      `tailwind.config.js`; `.pink` → `.theme-pink` same pass.

## Token notes

The `--sf-*` token names are already correct in the DB seed and generated at runtime.
The legacy unprefixed colours (`--primary`, `--text_primary`, …) are gone; `base.css`
keeps only app vars.

Component CSS that reaches for raw tokens directly is using the escape hatch. The right
migration is to the vocabulary class system (per-component decision), not renaming the
token reference.

**Utility/semantic classes (`sf-color-*`, `sf-bg-*`, etc.) are for content authors in the
editor — not for component code.** Replacing a raw token ref with a utility class is the
same coupling problem. Components migrate to vocabulary classes (`sf-variant-*`, `sf-depth-*`,
`sf-on-*`) so the theme owns the output through the seed.

## Implement missing class families

- [x] `sf-depth-*` bundles (`-0`, `-1`, `-2`, `-3`) — depth-0 is background only (canvas,
      no elevation). depth-1..3 carry background + shadow + radius; shadow escalates
      (md → lg → xl) and depth-3 gets a larger radius. Dark theme overrides the full
      surface palette (surface-0..9) so elevated surfaces lighten against the dark canvas.
- [x] `sf-heading-*` bundles (`-1`, `-2`, `-3`) — `font-size` + `line-height` at
      root. Wired via `SfHeading.addProseMirrorPlugins` appendTransaction in
      `contentExtensions.ts`: keeps `attrs.class` in sync with `attrs.level`
      (preserving other classes). `class` is the single source of truth — DOM,
      attribute panel, and code-view roundtrip all agree. `SfHeading` is shared
      with `htmlBlueprint.ts` so the code-view serializer matches the live editor.
- [x] `sf-variant-*` classes — `featured`, `danger`, `warning`, `success`, `alt-1` seeded.
      `sf-variant-danger` bare = text colour only; `sf-depth-1 × sf-variant-danger` = full
      solid button. Depth context determines the treatment, not a separate class.
- [x] `sf-size-*` bundles (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`) — form-factor scale; theme
      picks which properties express each step. This theme spends size on `--sf-padding`;
      bare `button` and `input` element rules in the seed consume it as `padding`, so any
      element carrying `sf-size-*` without local CSS gets scale-appropriate padding for free.
      Shape (`border-radius`) is deliberately not on this axis — comes from the element's
      own rule or an explicit `sf-radius-*` utility. `2xs` (0.25rem) added for breadcrumb /
      dense chip density.
- [x] `sf-loudness-*` bundles (`-1`, `-2`, `-3`) — vocabulary seeded; direction fixed to higher = more
      attention (consistent with all other numbered scales; heading-\* is the only exception, forced by
      HTML convention). Compound rules seeded for `sf-depth-1 × sf-loudness-1/3`. No editor wiring
      needed until a content-author picker is designed.
- [x] `sf-variant-alt-1` — vocabulary + compound rule seeded (`sf-size-xs.sf-variant-alt-1` → pill
      corners). Numbered from the start so alt-2 etc. are additive. The "alt" is relative to the
      default rendering of the full class combination, not just depth or loudness.
- [x] `sf-boundary-*` / `sf-divide-*` — vocabulary + rules seeded as `bundle` kind
      (`sf-bundle` layer). Multi-property theme compositions belong here, not in the
      auto-derived semantic layer. `AdminListItem` sticky actions cell carries
      `sf-boundary-left`; empty header `th` intentionally omitted (no content).
- [x] `sf-context` kind + `sf-is-overflow-{left,right,top,bottom}` — ClassKind,
      Layer, sort order, and generator support added. Vocabulary + rules seeded (mask-image
      gradients; same-axis compound rules for both-edges case). `OverflowRow.vue` migrated from
      inline `maskStyle` computed to `sf-is-*` classes on the scroller element.
- [x] `sf-is-edge-{top,right,bottom,left}` — viewport-flush context; vocabulary + rules seeded
      (zeros the two corners that touch the boundary). Author-applied (not JS-toggled).
- [x] `sf-is-overlay` — vocabulary + bare rule seeded. Reads `--sfx-surface-color` (bridge variable
      set by `sf-depth-*` bundles) so one rule covers all depths without duplicating colour
      knowledge. Establishes the `--sfx-*` bridge variable convention — documented in spec.
- [x] `sf-is-sticky` — vocabulary + bare rule seeded (border-bottom, done in 280e9fc).
- [x] `sf-element` layer + element markers — new `element` class kind + `sf-element`
      layer (declared below `sf-bundle` in the cascade order). Bare element rules
      (`button`, `input`, `table`, `td`, `th`, `tr`) now emit into this layer rather than
      `sf-bundle`, so any bundle/variant/state layered on top wins predictably — same
      baseline behaviour HTML elements get for free. `sf-chip` marker seeded as
      vocabulary (no rules yet — held to the spec's admission test: add rules when a
      consumer needs shape/colour distinct from bare `<button>`).
- [x] Bare `button` element rule — seeded in `sf-element`. `border-radius:
var(--sf-radius-2)`; `padding: var(--sf-padding, 0)` consumes the size axis so
      components with `sf-size-*` get scale-appropriate padding without writing
      `padding: var(--sf-padding)` locally; `font: inherit` so nested buttons pick up
      their container's type scale (e.g. `sf-text-xs` on a wrapper). Compound with
      `sf-is-overlay` bumps to pill. `cursor: pointer` (2.83.0) — the theme owns it, no
      longer Tailwind preflight; busy (progress) and disabled (not-allowed) override it.
- [x] Busy announcement — SfButton calls `announce('Loading')` (services/announce.ts)
      when `loading` turns on while it has focus; one hidden live region, SfAnnouncer,
      mounted in App and inside every modal `<dialog>` (content outside an open modal is
      inert; a closed dialog hides its copy, so exactly one is read). Out-of-sight CSS is
      component-owned, not theme vocab. A new modal must hold an `<SfAnnouncer />`. Each
      message goes only to the copy that could be heard when sent (`inModal`). SfButton
      takes focus when pressed if focus fell to something around it (Safari / macOS
      Firefox don't focus clicked buttons); mousedown.prevent buttons keep focus where it
      was. A busy button also announces when focus lands on it. announce() warns in dev
      when an open modal has no SfAnnouncer.
- [x] Bare `input` element rule — seeded in `sf-element`. Same padding/font contract as
      `button`. `input:focus-visible` sets `color: rgb(var(--sf-fg_primary))` +
      `background: rgba(var(--sf-fg_primary) / var(--sf-alpha-1))` — the "being edited"
      look. Any input in the app that gains focus now picks this up; components no
      longer need per-instance chrome for the editing state.
- [x] `sf-is-contained` context — vocabulary + rule seeded. Author-declared "this
      element sits inside a container that already provides visual boundary". Default
      expression drops the element's own chrome (`background: none`,
      `border-color: transparent`); theme can swap for reduced padding or muted colour.
      Consumers: NodePath breadcrumb button, EditorTopBar name/toggle/action buttons,
      ToolbarButton, SfOverflowMenu anchor.
- [x] Bare table element rules — seeded in `sf-element` (bare element selectors, specificity
      0-0-1). `table`: `border-collapse: separate; border-spacing: 0` (separate required for
      `box-shadow` on sticky cells). `td`: `border-bottom`, `vertical-align: middle`,
      `padding: --sf-spacing-xs --sf-spacing-sm`. `th`: same border + padding + `text-align: left`,
      `vertical-align: middle`, `font-weight: 600`. `tr:last-child td`: removes orphan bottom border.
      Depth compounds: `sf-depth-1 th` gets compact admin header treatment (xs font, uppercase,
      tracked, muted, nowrap) — specificity 0-1-1 beats bare th without extra classes on cells.
      Table padding lives in the seed (sf-element / sf-bundle layers) so `@layer ui`
      cell padding cannot override it — component-level padding differences must become
      seed compound rules.
- [x] `sf-is-loading` / `sf-is-error` — Loading: busy cursor + opacity 0.4 (2.82.0). A busy
      SfButton is never natively disabled (it would drop focus): aria-disabled + the click is
      stopped instead. Error: danger border (× sf-on-focus keeps danger).
- [ ] `sf-on-*` state class rules — vocabulary seeded for all states. Bare rules done for
      `sf-on-hover` (fg + subtle fill; no border channel yet — see hover-border
      investigation above), `sf-on-focus` (primary border-color; see also bare
      `input:focus-visible` in `sf-element` for the "being edited" look),
      `sf-on-disabled` (opacity 0.4 + not-allowed; vocab pseudo `:disabled`),
      `sf-on-selected` (2px primary outline; stateful, no pseudo — outline chip pattern:
      ColorPicker, ToolbarShadowControl, ToolbarCornersControl, FontPicker),
      `sf-on-current` (primary bg tint + border-color + text; stateful, no pseudo — "this
      option is on right now": ToolbarButton, NodePath leaf, ToolbarNodePicker, SlashCommands
      keyboard-highlighted item, EditorTopBar toggle when actions open. Border-color-only
      is invisible on bare buttons — see investigation above),
      `sf-on-ancestor` (muted primary text; stateful, no pseudo — reserved for
      nav/breadcrumb ancestors, no consumers yet). Compound done for
      `sf-on-hover × sf-variant-danger`. `sf-on-active` (pseudo `:active`): pressed tint one
      step past hover, bare + × loudness-2 + × current (v2.71.0; first consumer SiteNav).
- [x] `sl-*` layout primitives (`stack`, `cluster`, `columns`, `split`, `center`, `grid`) — vocabulary + rules in seed
- [x] `sl-aspect` — four preset classes seeded (`sl-aspect-16-9`, `sl-aspect-4-3`,
      `sl-aspect-1-1`, `sl-aspect-9-16`). `ToolbarAspectControl.vue` chip-picker
      registered in `defaultItemsStyle.ts` (shows on any block node, single selection).
      Bare `sl-aspect` kept in vocabulary as developer escape hatch (`--sl-aspect` inline).
- [x] `sl-collapse-*` container-responsive collapse classes — vocabulary in seed;
      CSS generated from `collapse_steps` table (DB-stored px values, not theme tokens;
      `var()` is not valid in `@container` conditions so values are read at emit time)
- [x] Migrate `--bg_secondary` consumers to `sf-depth-1` — done in commit 5a95dfe.
      Translucent floating-UI consumers (FloatingToolbar, FloatingDragHandle) use
      `sf-depth-2 sf-is-overlay` — surface translucency covered.

## Editor chrome migration (in progress)

Composing intent-only class combos instead of hand-written chrome. The pattern is:
component declares axes (`sf-is-contained`, `sf-loudness-*`, `sf-on-hover`,
`sf-size-*`, etc.) + carries only layout/positioning locally; theme owns colour,
background, border, radius, focus/hover expression via seed rules.

Done:

- [x] `ToolbarButton.vue` — now `SfButton` with `sf-is-contained`, `size="xs"` and
      `@mousedown.prevent`; `current`/`disabled` pass through. No local rules.
- [x] `NodePath.vue` — each block is an `SfButton` (`sf-single-line sf-is-contained`,
      loudness 1, size xs, `current` for the chosen depth, Doc `disabled`); container gets
      `sf-text-xs` (buttons inherit via bare `button { font: inherit }`); local
      rules are layout only. Previous asymmetric `padding: 1px 5px` replaced by
      the size axis feeding the bare button rule.
- [x] `EditorTopBar.vue` — top-bar container gets `sf-text-xs` (drops local
      `font-size`); `.top-bar__name` input carries `sf-is-contained sf-loudness-1
sf-on-hover sf-size-2xs`. The ⋯ toggle and Settings are `SfIconButton`, Save is
      `SfTooltip` + `SfButton` (`loading`, `variant` from the save state), all
      `sf-is-contained`, loudness 1, size 2xs; the toggle is `current` + `aria-expanded`. `.is-renaming` compound
      reduced to layout (flex grow / max-width / overflow / cursor); the editing
      look (fg-primary + subtle bg tint) now comes from bare `input:focus-visible`
      in the seed, driven by the input's own focus/blur.
- [x] `SlashCommands.vue` — `.dropdown-menu` gets `sf-depth-2 sf-size-2xs`; menu
      items get `sf-on-hover sf-size-2xs` (+ conditional `sf-on-current`);
      `.no-commands` placeholder gets `sf-loudness-1 sf-size-2xs`. Border and
      border-radius dropped locally — chrome is depth-2's call.
- [x] `SfIconButton.vue` — `SfTooltip` + `SfButton` + `SfIcon`; the tooltip is also
      the button's name. `size` defaults to `xs`; other `SfButton` props pass through.
- [x] `SfOverflowMenu.vue` — anchor carries `sf-is-contained` and `:loudness="1"`;
      dropdown container passes `sf-size-${size}` through to `sf-overflow-menu`.
- [x] `CodeViewToggle.vue` — floating toggle now composes `sf-depth-2 sf-is-overlay`
      on top of ToolbarButton. See "To investigate" — ToolbarButton's hardwired
      `sf-is-contained` may be stripping depth-2's chrome here.
- [x] `ToolbarScrollHint.vue` — hardcoded `padding: 4px 12px` replaced by the size
      class. Now an `SfButton` (`sf-depth-2 sf-is-overlay`, size xs) named "Scroll to
      toolbar"; centred with auto margins (not a transform a theme could override);
      gaps are `--sf-spacing-xs` / `--sf-spacing-md`, the scroll math keeps `+ 8`.
- [x] `ToolbarNodePicker.vue` rows and `ToolbarAttributeEditor.vue` add rows are
      `SfButton`s; full-width rows set `display: flex`, `justify-content: start` and
      `white-space: normal` over SfButton's centred single-line default.
- [x] Toolbar-picker state classes migrated from legacy `is-active`:
      `ColorPicker.vue`, `FontPicker.vue`, `ToolbarCornersControl.vue`,
      `ToolbarShadowControl.vue` chips → `sf-on-selected` (outline-chip pattern);
      `ToolbarNodePicker.vue` items and `SlashCommands.vue` keyboard-highlighted
      item → `sf-on-current` (tinted-fill pattern). Legacy local `.is-active`
      rules removed; expression comes from the seed.
- [x] Form-input focus/disabled expression migrated from local `:focus` CSS to
      state classes: `ToolbarAttrRow.vue`, `ToolbarRevealInput.vue`,
      `ToolbarCornersControl.vue` inputs carry `sf-on-focus` (+ `sf-on-disabled`
      on the corners inputs). Local `:focus { border-color: … }` blocks removed.
- [x] `@layer components` → `@layer ui` bulk rename across component `<style>`
      blocks touched in this slice (~13 files). Mechanical rename to match the
      Foundational cascade order; no per-component tracking needed going forward.

## System design gaps (known, intentional for now)

These are not bugs but unresolved tensions in the current design:

- **Raw token refs in component CSS** — many components still reference `--border_color`,
  `--primary` etc. directly in their CSS. The correct approach is for components to use the
  class system (`sf-variant-*`, `sf-on-*`, depth bundles) rather than raw tokens, so themes
  can change class definitions without touching component code. The class system doesn't yet
  have equivalents for everything (e.g. no "add a themed border" class, no
  "floating-surface at 90% opacity" class). These components must stay on raw tokens until
  the right higher-level class exists. Gap values are resolved — all component CSS now uses `var(--sf-gap, var(--sf-spacing-*))`
  (keeps the channel open with a scale-step default) or `sl-*` + `sf-gap-*` (structural
  layout containers where `sf-gap-*` is authored on the node).
- **`--bg_secondary` migration** — cannot be replaced with a raw `--sf-surface-*` token
  because surface-N is just a numbered color slot, not a semantic "secondary surface" token.
  The right migration is to add the appropriate `sf-depth-N` bundle class to elements that
  match that depth level, and remove their explicit background CSS. Floating/translucent
  surfaces use `sf-depth-N sf-is-overlay` — `sf-is-overlay` reads `--sfx-surface-color`
  (set by the depth bundle) at `--sf-alpha-9`.

## Editor + Vue components

- [x] ~~`nodeClassTokens.ts:21` uses prefix `sf-collapse-`. Collapse is arrangement →
      should be `sl-collapse-`.~~ Done — also updated `LayoutColumns.vue`,
      `LayoutSplit.vue`, and `initialContent.html`.
- [x] `LayoutCard.vue` — wears `sf-depth-1`; variant prop removed entirely (cb1a466);
      cards are composed with vocabulary classes (`sf-variant-alt-1`, `sf-variant-featured`,
      `sf-loudness-*`) at the call site rather than via a prop. No in-component variant CSS.
- [x] Layout components' roots wear their `sl-*` class only: `LayoutSection` → `sl-stack`,
      `LayoutColumns` → `sl-columns`, `LayoutSplit` → `sl-split`, `LayoutCover` → `sl-cover`,
      `LayoutCenter` → `sl-center sl-stack`. The node view's content box between the root and
      its blocks steps aside (`display: contents`, `api/src/domain/css/nodeViews.ts`), so the
      blocks are the layout's items. Not for `sl-inset`, whose rules place its own children.
      Full migration — the layout class on the content box itself, so nothing steps aside —
      would need each layout component to render TipTap's content element as its root.
- [x] Layout components moved to `components/layout/` — they are general components; TipTap
      wraps them externally so the components themselves have no editor dependency. Call sites
      outside the editor use them directly with `sf-gap-*` as a class attribute.
- [x] `LayoutCard.vue` — wears `sf-depth-1`; background inherited from bundle (5a95dfe).
- [x] `CollectionView.vue` read its address once: going from one collection to another (the
      menu's Branding, then Software Development) showed the first one's pages under the second
      one's title, as `<RouterView />` keeps the view when only the address changes. Fixed
      2026-10-03: `usePagesByCollection(Admin)` take the address as it changes, as `usePage` does.
- [x] `CollectionView.vue` picked the admin or the public page list once, as it opened. Live
      keeps sign-in for the tab only (`zitadelAuth.ts`), so a new tab starts signed out and
      a sign-in landing after the app mounts would arrive late: an admin opening a collection in
      a new tab on live got the public list. Locally sign-in is kept
      across tabs, so it hardly showed. Fixed 2026-10-03: `usePagesByCollection` picks the
      list itself and follows sign-in, as `usePage` does, keeping the list shown until the
      other arrives (checked in Chrome: sign-in landing on an open collection brings in its
      unpublished pages and its admin links).
- [x] The editor read its address once (found 2026-10-01): going from one editor address to
      another (`/editor/home` to the Demo link, or back) kept the page open. Fixed 2026-10-03:
      each address opens in a new editor (`TiptapEditorDemo.vue`), as arriving does, so undo
      and Save can't reach the page before. Saving a new page gives it an address; that's the
      page already open, so it keeps its editor and undo. A page or a save that comes back
      after the address has moved on leaves the new editor alone (`loadPage`, `save`). A
      change to the hash alone opens nothing. Checked in Chrome against faked replies: page,
      Demo, back, a slow page overtaken by the Demo, a new page saved.
- [x] **The practice** (2026-10-03): a view follows its address and sign-in; shared code takes
      what changes (a getter or ref, `MaybeRefOrGetter`), not its value at the time. Vue Router
      keeps a view while only its address changes, and live's sign-in lands after the app
      mounts. A fresh view for every address was rejected: a collection's `?open=` would
      rebuild it, and a saved new page's address would rebuild the editor mid-edit. Lint:
      `vue/no-ref-object-reactivity-loss` (client `.vue` and `.ts`) flags reading a ref's value
      in the file that made it (it flags the collection bug above). It can't see refs a
      composable or store hands over (`useIsAdmin()`, `useQuery`), so a choice made once from
      `isAdmin.value`, or `route.query` read once, passes.
- **Code review of the above** (separate agent, 2026-10-03): four findings from the change,
  fixed. A save of a new page that came back after the address moved on wrote its page into
  the next editor (the next Save overwrote it, and the page missed its collection); a hash
  change reset a page with no address of its own; sign-in landing blanked the collection to
  placeholders; a comment in `TiptapEditor.vue` described the removed wait for an editor.
  Logged below, predating it.
- [x] The editor doesn't follow sign-in: a new tab at `/editor/<page>` on live starts signed
      out, so the page fails to load (no message) and Save makes a new page instead of
      updating it (proved in Chrome by the review). Decided with the user: fix it at the router,
      for every page that needs sign-in. Built 2026-10-03; shipped with step 3 of `docs/auth.md`
      (2026-10-04), where `meta.authName` became `meta.signIn` and sign-in is known after one
      question to our server.
    - **The router decides access, on every visit.** A page that needs sign-in waits until
      it's known whether you're signed in (`whenSignInKnown()`), then lets you in or sends
      you to sign in; a page with `meta.role` sends anyone signed in without it to
      `no-access`. Today a new tab is sent to sign in at once, and `/admin`'s pages pick
      themselves or No access when their code first loads, which the router keeps until a
      reload.
    - **`/editor/:slug` is its own route, `editor-page`**, for admins; `/editor` (the demo,
      the layout test cases, a new page) stays open to anyone. Moving between the two keeps
      the same view, so a saved new page keeps its editor.
    - **New names** (approved by the user): `whenSignInKnown()`, `editor-page`, `meta.role`,
      `no-access`.
    - **Checked** in Chrome with a stored sign-in faked: an admin opens `/admin` and a stored
      page, and saving a new page keeps its editor; someone signed in without the role gets
      Access denied on `/admin`, `/admin/pages` and a stored page, but opens `/account` and
      the demo; signed out, the demo opens without asking. Layout checks pass (100).
- [x] **The hidden sign-in can't work** (found 2026-10-03, settled 2026-10-04). Its return
      address wasn't registered (Zitadel answered 400); registered on 2026-10-04 in both apps
      (`/auth/signinsilent/zitadel`), Zitadel still refuses: its login page won't be framed
      (`X-Frame-Options: DENY`, `frame-ancestors 'none'`) and its cookie is same-site, so the
      frame always times out after 10 s. Allowing frames loosens Zitadel instance-wide and
      Safari would still block it; rejected. The router check that waits for sign-in (built,
      uncommitted) would make a signed-out new tab wait those 10 s, so it ships with the server
      sign-in below, not before. The addresses go when the old apps do.
- [ ] **Sign-in through our own server: design agreed 2026-10-04, see `docs/auth.md`** (reviewed
      by three agents and checked against Zitadel's own examples). Our server signs you in,
      keeps Zitadel's tokens sealed in D1 and refreshes them; the browser gets only our own
      cookie, so every tab is signed in, in every browser, and the account page's Zitadel calls
      move to our API. Built in the steps listed there; its "Progress" section says where it's up
      to (steps 0–4 done 2026-10-04, the old Zitadel apps kept for now; live is next).
- [x] The sign-in libraries are unmaintained: `oidc-client` 1.11 (its successor is
      `oidc-client-ts`) under `vue-oidc-client` 1.0.0-alpha.5 (last released 2022), both used
      by Zitadel's own `@zitadel/vue`. Removed with the server sign-in above (step 3, 2026-10-04).
- [ ] `usePage` blanks when sign-in lands: the home page and a page preview show nothing until
      the admin copy arrives (the collection list keeps its own now).
- [x] Undo straight after a page opens empties it: loading the content counts as an edit
      (TipTap's `setContent` is recorded for undo), so Save would then store an empty page.
      The same for the demo. Checked in Chrome 2026-10-03; predates the fix above. Fixed
      2026-10-06: candidate 14.
- [ ] Nothing warns before unsaved edits are lost. Leaving the editor drops them (predates);
      moving to another editor address now does too, where it used to keep the page open.
      Opening a page no longer says the content changed (candidate 14), so a warning can count
      the editor's update events as edits.
- [ ] A new page whose collection fails to be set after it's made never gets it: the next Save
      updates the page without its collection. Read in code, not tried.
- [x] `FloatingToolbar.vue`'s unmount reads the closed editor's view, logging "\[tiptap error]
      The editor view is not available". It removes its listeners first, so nothing leaks.
      Predates; it now also shows on every move between editor addresses. Fixed 2026-10-06: 17.
- [x] `useCollapseBreakpoint.ts` calls `stopWatch()` from its first run, before `stopWatch` is
      set: a collection opened with the theme already loaded logs "Cannot access … before
      initialization". Found by the review; unrelated. On Vite (5173) Vue's development build
      rethrows it from setup, so `/admin/pages` shows no list at all. Fixed 2026-10-06: 17.

## Deferred (pending design pass)

- [x] **Chip / button colour styling** — done in d4f8d74 (v2.19.0). `sf` membership
      marker added (opt-in, keeps third-party elements unaffected); `sf-chip` bundle seeded
      (pill radius, ghost border, single-line); bare variant changed to text-tint only;
      loudness governs fill weight (1=dim text, 2=outlined, 3=solid+inverted);
      `sf-on-hover × sf-loudness-3` darken compounds added per variant; toolbar chip buttons
      (`ToolbarAspectControl`, `FontPicker`, `ToolbarShadowControl`, `ToolbarCornersControl`)
      migrated from local `.ap/.fp/.sp/.cp-chip` CSS to `sf sf-chip sf-size-xs sf-on-hover sf-on-selected`.
- [ ] **Idea: collapse by a layout's own width** (2026-10-02, not decided). Layouts that work
      out their columns from their own width (`sf-references.md`, "Layouts that switch by
      their own width") would stack without a container query.
    - What it would fix: plain div blocks and component blocks would stack alike, bleeding or
      not. Most of the collapse layer's measuring boxes would go, including boxes sized by
      their content (which measure 0 wide), the popover exceptions and wrappers as
      containers.
    - What it must keep: `sl-row` (so the grid version, not flex), gaps, and container
      queries for hide/show.

## Deferred (decided in spec review, not done)

- `--sf-fg_primary`, `--sf-fg_inverted`, `--sf-border_color`, `--sf-primary`,
  `--sf-shadow` retained as legitimate system semantic tokens (broadly applicable,
  not Vuestic-specific). The underscore form on composite names (`fg_primary`,
  `fg_inverted`, `border_color`) follows the spec convention.
- Typography bundles now in spec as `sf-heading-*` (parallel family to `sf-depth-*`
  inside `sf-bundle` layer). Implementation tracked under "Implement missing class
  families" above. Other typography families (`sf-body-*`, `sf-caption-*`, etc.) can
  join later as new families inside the bundle layer.
- Status colour classes (`sf-variant-success`, `sf-variant-info`, `sf-variant-warning`)
  not added — only `featured`, `subtle`, `danger` are in the variant set. Status
  semantics may want their own treatment when Vuestic is removed.

## For the docs (when there are some)

Examples worth keeping for page builders and component makers (checked in Chrome, 2026-10-03).

- **Columns placed straight in an inset stack late** (candidate 5 above). They measure the
  whole inset, margins included: with the page at 640px (sm) they stay side by side, and only
  stack once the inset itself is 640px or less. Put them in a stack, which is as wide as the
  line, or use the editor's Columns block, which measures its own space:

    ```html
    <!-- Stacks late -->
    <div class="sl-bleed sl-inset">
    	<div class="sl-columns sl-collapse-sm">
    		<p>One</p>
    		<p>Two</p>
    	</div>
    </div>

    <!-- Stacks at sm -->
    <div class="sl-bleed sl-inset">
    	<div class="sl-stack">
    		<div class="sl-columns sl-collapse-sm">
    			<p>One</p>
    			<p>Two</p>
    		</div>
    	</div>
    </div>
    <div class="sl-bleed sl-inset">
    	<layout-columns columns="2" class="sl-collapse-sm">…</layout-columns>
    </div>
    ```

- **Don't centre the items of an inset that holds a page.** The page shrinks to its margins
  (48px). Centre the other items in a layout of their own; `page-content` is TipTap's mount
  box:

    ```html
    <!-- The page is 48px wide -->
    <div class="sl-inset sl-align-x-center">
    	<h1>A title</h1>
    	<div class="page-content">…</div>
    </div>

    <!-- The title is centred, the page full width -->
    <div class="sl-inset">
    	<div class="sl-stack sl-align-x-center"><h1>A title</h1></div>
    	<div class="page-content">…</div>
    </div>
    ```
