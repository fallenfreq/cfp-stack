# Plan: the saved page is what the author made

Ways the saved page (the editor's JSON) ends up different from what the author made, shown in
Chrome on the test page (`/editor?seed=tests`). Each is fixed once, where it happens, not per
block, and each step is a session of its own. Deleted when done, as every plan is.

## Plan

Each step runs as `.claude/skills/ship-step/SKILL.md` says.

1. **Enter makes the new block the same way everywhere.** Enter splits a block in two: the block
   you were typing in keeps everything, and the new one gets only what carries over to a new
   block. TipTap does this for a list or to-do item, but not for the paragraph inside it, nor for
   paragraphs and headings. A paragraph split at the start or in the middle, or a heading split
   in the middle, gives both blocks everything, id included, and at the start of a heading the
   empty line gets nothing. This is TipTap's bug
   [#4591](https://github.com/ueberdosis/tiptap/issues/4591), open since 2023.

    | Enter at | Keeps everything       | The new block        |
    | -------- | ---------------------- | -------------------- |
    | The end  | the line with the text | the empty line below |
    | Middle   | the first half         | the second half      |
    | Start    | the line with the text | the empty line above |
    - The class and style carry over, the id doesn't. What carries over is set for each attribute
      (TipTap's `keepOnSplit`); TipTap carries everything over, id included, unless told not to.
      A heading's new line stays a plain paragraph at the start and the end.
    - Where: TipTap's Enter for blocks (`splitBlock`) and for the paragraph in a list or to-do
      item (`splitListItem`), patched in the repo the way TipTap's own list-item code does it,
      and offered on #4591. The patch is made again on each TipTap upgrade (it stops applying if
      TipTap's code changed), and goes when TipTap releases a fix.
    - Enter on an empty last item of a nested list moves it out a level, and it keeps its own id
      and class, as a moved block does. Today TipTap makes the item anew with nothing on it, and
      its paragraph keeps only what carries over.

2. **One id, one block.** Pasting a copied block gave the copy the block's id, and taking an
   item out of a list, quote or Card gave both halves its id (Enter did too: step 1). An id is
   for one block: when a change leaves an id on more blocks than before, and a block that was
   already there still has it, the blocks the change put in go without it. A block is put in
   when the change writes it anew: a paste, a drop, a list split in two, but also a block moved,
   wrapped or changed. Those leave the id on as many blocks as before, so the rule leaves them.
   The page is read only when a block put in has an id, so typing costs nothing; no list of ids
   is kept alongside the page.
    - Ids the author writes are kept as written, even two the same. The code view and opening a
      page replace the whole page, so no block in it was already there. The Attributes panel
      saves its changes as settings of the block that's there; today it writes the block anew,
      which the rule would take for a copy. Undo and redo put back what was there, so the rule
      leaves them. When every block with the id was written anew, the rule can't tell which was
      there first and leaves them all. Two blocks with one id get a validator rule, "two blocks
      share the id …", added to `sf-system.md`, "Validator and linter".
    - Where: one rule run after each change, in the extension that gives blocks their id
      (`allowAttributesExtension.ts`). Copies come from many places (paste, drop, the drag
      handle's copy, a list, quote or Card split in two), so no one command owns them.
    - The cases, each a check in `editor.spec.ts`:

        | Change                                                                                             | The id ends up on                                                                          |
        | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
        | Paste a copy of a block (a paragraph, a Card, a table, a to-do list)                               | the block copied, not the copy                                                             |
        | Drop a copy (dragged with Alt, or the drag handle's copy)                                          | the block copied, not the copy                                                             |
        | Select a block, cut it and paste it                                                                | the pasted block                                                                           |
        | Select a block's text (not the block), cut it and paste it                                         | the empty line left behind, not the pasted text                                            |
        | Paste blocks from another app or page                                                              | each, unless the page has it; the first block joins the line at the cursor and its id goes |
        | Drag a block to move it                                                                            | the block, moved                                                                           |
        | Enter anywhere in a paragraph, heading, list or to-do item                                         | the block it was pressed in, as step 1 says                                                |
        | Take an item out of a list, quote or Card (Backspace, Enter on an empty line, Shift-Tab, a button) | the top half, or the list left when it's the first item                                    |
        | Join two blocks with Backspace or Delete                                                           | the first; the second's goes. If the first is empty, the second                            |
        | Add a table row or column                                                                          | nothing new: the new row and cells have none                                               |
        | Wrap or unwrap a block, or change it with Change Type, the cursor in it                            | the block                                                                                  |
        | Give a block an id another has, in its Attributes panel (paragraph, picture, video, line)          | both                                                                                       |
        | Write two blocks with one id in the code view                                                      | both                                                                                       |
        | Two blocks the author gave one id: move, wrap, change or type in one                               | both                                                                                       |
        | Two blocks the author gave one id: cut one and paste it                                            | the other: the page still has it                                                           |
        | Undo, redo                                                                                         | as it was before the change, or after                                                      |

3. **Dropped: a block changed in place** (owner, 2026-10-19). The id rule was to count a block
   whose settings or type were written as the whole block as the one that was there. Nothing in
   the app gives an id that way (the Attributes panel saves it as a setting), and TipTap's Change
   Type writes a block that way with its Card's id on it (step 5), which the rule takes off.
4. **Moving blocks selected together moves each once.** A block and one inside it can be chosen
   together ("Add all children" keeps the block chosen), and the tools that move them (Move
   before or after, Replace, dragging them) took each on its own: the inner one moved inside its
   block and again by itself, so its text was copied, id and all. Choosing stays as it is; the
   tools that move take a block inside a chosen one with its block (`blocksToMoveTo`,
   `multiSelect.ts`), and the drag's preview shows what moves. Nothing moves beside or over a
   block inside one that moves, by the toolbar or a drop.
    - New: a block inside one that moves, dragged by its own handle, goes on its own, chosen or
      not, and one block to move is an ordinary drag (Alt copies it). Before, a chosen one
      dragged every chosen block.
    - A chosen picture pasted over stays chosen (`changedInPlace`), and no check covered it: one
      is added with this step. With blocks chosen the toolbar shows only the selection's tools,
      so the Corners control can't reach it.
5. **Changing a block's kind keeps what the author set.** A change that writes a block anew but
   is meant to leave the same block, of another kind, keeps its id, class and style, and any
   other setting its new kind has; only what the change is for is new. TipTap's commands gave the
   new block the kind's defaults, or the settings of the block around the selection: the list
   buttons and keys, Change Type, the Heading and Code Block buttons, `## ` and a code fence
   typed, Backspace in an empty code block. An item taken out of a list goes, its settings with
   it, as a quote's do with Unwrap; the line keeps its own.
6. **Copying takes the code view's version.** The editor draws some built-in blocks with classes
   of its own, which aren't saved and don't show in the code view: lists `sf`, quotes
   `sf sf-depth-1`, code blocks `sf hljs`, to-do items `sl-split sf-gap-md`, tables
   `tiptap-table` (and a `min-width` style). Copying took the page as drawn, so pasting saved them
   as the block's own, and the code view then showed them on the copy only. Copying writes what
   the code view writes, so they are drawn only, like a component's own look (the Card's
   `layout-card sf-depth-1`). Headings are the exception until "Later" below.
    - To check: another app (email, Google Docs) then gets the code view's HTML, so a pasted
      to-do list has no drawn tick boxes there.
    - `editor.spec.ts`, "a pasted to-do list has the blocks and text of the one copied", says the
      classes are kept on paste: it changes with this step.
    - Until then, a list pasted from the page carries those classes to its new kind when its kind
      changes (step 5 keeps them): a to-do list's items made bullet items show no bullets.
7. **The code view refuses what the page can't keep.** Leaving the code view dropped without a
   word a paragraph's `title`, `lang`, `data-…` and `onclick`, and HTML comments (a link's
   `title` was kept). An unknown element is refused today; so is anything else the page can't
   keep: the code view stays open and says what and where ("The page can't keep `title` on
   `<p id="…">`"). It asks only whether each element and attribute the author wrote is still
   there, so what the page adds or rewrites itself (spaces, attribute order, a link's `rel`)
   never refuses their code. Some things have to go (`onclick` runs code): the author takes them
   out. Comments are refused too, for now.
8. **Wrap selection keeps the blocks between.** With A and C chosen and B between them, Wrap
   selection put A and C in a quote or Card and deleted B without a word (Undo brings it back): it
   replaces everything from the first chosen block to the end of the last
   (`defaultItemsMultiSelect.ts`, `wrapSiblingsInType`). What becomes of B is found when the step
   is planned.
9. **Pasted text and the line it lands in.** A heading's text pasted at a line's start, or into an
   empty line, makes the line a heading with the copied heading's class and style, and the line
   loses its own: ProseMirror keeps a copied heading's kind on purpose. Text copied across two
   lines and pasted at a line's start gives the line the copied line's settings, and it loses its
   id. What pasted text keeps is found when the step is planned.
10. **A span's text survives a change of kind.** Code Block, a code fence typed, and Backspace or
    Delete into a code block delete a span with its text; bold and links keep their text.
    ProseMirror clears what a code block can't hold (`clearIncompatible`).

Later, the owner's call:

- A heading's level class (`sf-heading-2`) is saved on every heading and shows in the code view.
  f0b5f39 saved it because drawing it the way lists are drawn ran into step 6's bug. After step 6
  it could be drawn only, as the level is the heading's own setting.
- Keeping HTML comments written in the code view (owner, 2026-10-18: not now).

### Decisions

- **Each fix is made once, where it happens, not per block** (owner, 2026-10-18).
- **A duplicate id the app would make isn't made; one the author writes gets a validator
  warning** (owner, 2026-10-18). The app doesn't change the author's content.
- **No list of ids kept alongside the page**: the page is the only record, read when a block put
  in has an id (owner, 2026-10-18). A list would have to follow every kind of change.
- **Enter is fixed at its root, for classes as well as ids, not for ids alone** (owner,
  2026-10-18), with a patch to TipTap offered on #4591.
- **Enter goes first** (owner, 2026-10-18): it stops most second ids where they start, so the id
  rule is left with copies and lists split in two, and no check pins what Enter does before it's
  fixed.
- **Enter carries the class and style over, not the id; an empty nested item moved out a level
  keeps its own** (owner, 2026-10-18).
- **Changing a block's kind is a step of its own** (owner, 2026-10-18): it loses ids; the one it
  copies, from the block around it, the id rule takes off.
- **Copying takes the code view's version, not the page as drawn** (owner, 2026-10-18).
- **A block written whole counts as put in; ids are given as settings** (owner, 2026-10-19). The
  rule tells the editor's duplicates from the author's by how the change was written. Counting a
  block written whole as the one there (step 3, dropped) would have kept the id Change Type
  copies. A tool that gives ids saves them as settings, with a check like the Attributes panel's.
- **The Attributes panel saves a setting as a setting** (owner, 2026-10-18): an id given there
  stays, even one another block has, and the block stays selected, as a picture did.
- **Moving blocks selected together is a step of its own** (owner, 2026-10-18): it copies text,
  ids or not, so it's fixed in the selection, not in the id rule.
- **A block and one inside it can be chosen together; moving takes the inner one with its
  block** (owner, 2026-10-19), so it's fixed where they move, not in the selection. Settings for
  every selected block, once built, may want both (`sf-system-todo.md`, "Settings for every
  selected block"); only moving them copied.
- **A block changing kind keeps its settings; TipTap is upgraded first, then patched** (owner,
  2026-10-21). TipTap 3.32.0 changes a list between bullet and to-do itself, which the app's own
  code did for the toolbar only; the patch keeps the settings where its commands write the block.
- **The toolbar's list tools change the list the node path points at** (owner, 2026-10-21), as its
  other block tools act on their target; the keys and the slash menu change the list the cursor is
  in. A list's button for its own kind takes every item out; a line in a list has its own Bullet,
  Numbered and Task List buttons, which take its item out.
- **A list changing kind stays apart from the lists beside it, and the lists in it stay as they
  are** (owner, 2026-10-21): joined, one's settings would go. A numbered list then starts its own
  numbers; the author can set where in the Attributes panel.

## Progress

- **Plan written** (2026-10-18), from probes in Chrome. Found, outside this plan: every link
  saves `rel="noopener noreferrer nofollow"`, which the author never wrote (TipTap's default);
  `nofollow` tells search engines not to follow the site's own links. Raised.
- **The id rule, first version** (2026-10-18), not committed. The review found that it told
  added blocks from old ones by the kind of change, which went wrong three ways. An id given to
  a picture in its panel was taken off. Moving one of two blocks the author gave one id took its
  id off. Taking an item out of a list gave both halves the list's id (from before). The rule
  (now step 2) is rewritten above, and Enter has a step of its own, classes included.
- **Plan reviewed** (2026-10-18) by a fresh agent, every finding measured again. The rule needed
  "a block already there still has it" (without it, a cut block pasted lost its id). A move or a
  wrap writes the block anew too; it's the count that spares it, so the panel writes every block
  anew today, not only a picture. Enter's step left out the paragraph in a list item. Rows added
  for cutting a block's text, pasting from elsewhere, joining blocks and table rows. Four changes
  of kind lose a block's id and class (now step 5). The reviewer found that builders where
  authors write the ids mostly only flag duplicates (Webflow, WordPress); here most duplicates
  come from the editor itself, so both steps stay, with the validator for what authors write.
- **Plan signed off** (2026-10-18), with the decisions above.
- **Step 1 done** (2026-10-18): a patch to TipTap's Enter (`splitBlock`, `splitListItem`:
  `patches/@tiptap__core@3.31.4.patch`), and the id doesn't carry over (`keepOnSplit`). Pressed in
  34 places (paragraphs, headings, quotes, table cells, list and to-do items, selections, nested
  items), Enter matches the table, and undo puts the page back each time; four checks in
  `editor.spec.ts`, each failing without its part. Reviewed by an agent; its seven findings
  checked and fixed. Text selected from the start of one block into the next made Enter do
  nothing or move a type and an id: the block is now read once the text is gone, which also stops
  TipTap losing text in one case. A selected list item split its list with the id on both. An
  empty heading at the end of a nested item came out as two lines. Typing after Enter at the
  start undid in two steps; now one, unless an id comes off the empty line (as with TipTap's
  headings). Not named by the plan: an empty line with text above it in a nested item moves out
  as a new item, with the item's class and style, and keeps its own. Found, outside this step:
  Enter on an empty middle line of a quote or a Card splits it with its id on both (step 2,
  whose table now names Cards); an item taken out of a list loses its own id and class (now in
  step 5). The owner agreed to both, and to the nested item's line. Unit tests pass (4 + 34).
- **Step 2 done** (2026-10-18): the rule, run after each change (`allowAttributesExtension.ts`),
  and the Attributes panel saves an attribute as a setting of the block (`setNodeAttribute`), so
  an id given there stays. A probe in Chrome showed the rule deciding each row of the table as
  planned; six checks in `editor.spec.ts`, each failing without its part. The rule takes under a
  millisecond a change on a page of 9,000 blocks. Reviewed by an agent; its findings checked. A
  block deleted and brought back by Undo, while another has its id, now has a check (without undo
  left alone, it came back without its id), and so does a block moved. New: after a change in the
  panel, a paragraph or heading stays selected, Escape closes the panel, and Undo works once you
  are back in the page, as with a picture; before, the selection became a cursor in the block, and
  the keys went straight back to the page. Found, outside this step: moving blocks selected
  together, with a block and one inside it both chosen, copies the inner one, and both copies keep
  its id (every block with it was put in, so the rule keeps them all; now step 4). The owner
  agreed that the rule should leave a block changed in place however the change is written,
  rather than rely on the panel saving a setting alone (now step 3); the panel keeps its change,
  and its keys after Enter are parked (`sf-system-todo.md`, Editor). Unit tests pass (4 + 34).
- **Step 3 planned again, then dropped** (2026-10-19), from probes in Chrome. A copied picture,
  line or video pasted over a selected one is the same change as one written anew, so step 3 was
  planned for blocks with content only. A fresh agent's review of that plan found that Change
  Type, Heading and Code Block on a block selected as a block write it that way with the
  settings of the block around it (TipTap's `setNode`, `toggleNode`): the rule takes the copied
  id off today, and with step 3 the page would have kept two. Nothing in the app gives an id
  written as the whole block, so the owner dropped the step; no code changed. Found on the way,
  now in step 5: those changes lose the block's own id and class, so do `## ` typed at its start
  and a heading's text pasted at a paragraph's start, and Code Block deletes a span's text. In
  step 4: no check covers a chosen picture staying chosen when written anew.
- **Step 4 done** (2026-10-20): Move before or after, Replace and a drag take a block inside a
  chosen one with its block, and nothing moves beside or over a block inside one that moves
  (`blocksToMoveTo`, `multiSelect.ts`); choosing is as it was. Measured in Chrome: a Card chosen
  with its paragraphs, moved by each tool or dragged, copied them, and no longer does; Delete
  already worked. Two checks in `editor.spec.ts`, each part failing without it. Reviewed by an
  agent; its findings checked. A drop onto a block inside a Card that moves still moved the other
  blocks there (from before, and new when that block was chosen): now refused, as in the
  toolbar. Checks added for Move before, Replace, a block moved beside its own Card, and the drop.
  Found, outside this step: Wrap selection, with a block not chosen between two chosen ones,
  deletes it (Undo brings it back); a drag of several blocks ignores Alt; the handle of a block
  not chosen that holds chosen ones drags those, or itself when there's one; the drag picture
  counts "nodes". The owner made Wrap step 8, the rest are in `sf-system-todo.md`, "Editor".
  Unit tests pass (4 + 34). Afterwards the three tools and the drop share one move
  (`moveBlocks`), and all 180 runs of `editor.spec.ts` pass. Before, on a very busy machine, some
  WebKit runs failed: timeouts that pass alone, and "undo in the code view undoes only the code",
  which fails without this step too. A WebKit bug found on the way, the page jumping to its top
  after a drag, was fixed next (`FloatingDragHandle.vue`).
- **Step 5 done** (2026-10-21). TipTap went to 3.32.0 first (2f609f5): its list command changes a
  list between bullet and to-do with every item. Before, the keys and the slash menu took the item
  out into a new list, and in a nested list split the outer one in three; the app's own
  `switchListType` did it for the toolbar only, and is gone. The patch
  (`patches/@tiptap__core@3.32.0.patch`) keeps a block's settings in `setNode`, `toggleNode`,
  `clearNodes`, `toggleList` and the typing shortcuts. `toggleList` also changes a list selected
  as a whole (the buttons there kept only its first item in a list), leaves the lists in it as
  they are (3.32.0 changed them too, and dropped their ticks), and joins no list changing kind;
  lines made into a list join only the list above. The toolbar's list buttons and Change Type
  change the list the node path points at (`changeTargetList`, `defaultItemsBlock.ts`), a line has
  a Task List button, and a list's item type comes from TipTap (`LIST_ITEM_MAP` is gone). Measured
  in Chrome; one check in `editor.spec.ts`, of 30 cases, each part of the patch and the toolbar
  failing its own without it. The plan, the fixes the first code review led to, and the code were
  reviewed by an agent five times in all; every finding checked. Unit tests pass (4 + 34); all 660
  runs of the Playwright checks pass. Found, outside this step: pasting (now step 9), a span's text
  (now step 10), a list pasted from the page carrying its drawn classes (step 6), the toolbar's
  target with the page or a Card selected whole, and a chosen list leaving the choice
  (`sf-system-todo.md`, "Editor"). Text selected from a list into the line after it, then the
  line's list button, makes the line part of the list, as before.

Next: step 6, in a session of its own.
