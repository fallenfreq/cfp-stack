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
6. **A block's own look is drawn, not saved.** The editor draws some built-in blocks with a look
   of its own: lists `sf`, quotes `sf sf-depth-1`, code blocks `sf hljs`, to-do items
   `sl-split sf-gap-md`, a table TipTap's width from its columns, a heading its level's
   `sf-heading-*`. It was written into the block's HTML, which copying writes, so a paste saved it
   as the block's own and the code view showed it on the copy only; a heading's the editor saved
   on every heading, kept in step with its level. Each block's look is drawn now, as a component's
   template draws its own (the Card's `layout-card sf-depth-1`), and is never one of its settings:
   each block sets it up as its `ownLook`, which `ownLook.ts` draws.
    - A heading wears its level's `sf-heading-*` unless it has one of its own: its prominence can
      differ from its level (`sf-system.md`, "Headings"). The editor replaced the author's with
      its level's, and took one off any other block.
    - Inline code keeps its `sf` in its HTML: code has no settings for a paste to save it in.
      Tables lose `tiptap-table`, which nothing has styled since 2b3cb95.
    - Another app gets the blocks without the editor's classes, and still gets a to-do list's
      tick boxes (TipTap's HTML).
7. **The code view refuses what the page can't keep.** Leaving the code view dropped without a
   word a paragraph's `title`, `lang`, `data-…` and `onclick`, and HTML comments (a link's
   `title` was kept). An unknown element is refused today; so is anything else the page can't
   keep: the code view stays open and says what and where ("The page can't keep `title` on
   `<p id="…">`"). It asks only whether each element and attribute the author wrote is still
   there, so what the page adds or rewrites itself (spaces, attribute order, a link's `rel`)
   never refuses their code. Some things have to go (`onclick` runs code): the author takes them
   out. Comments are refused too, for now.
    - What's asked about: each attribute, class name and style property. Kept: what's written for
      the element, or the same part the page writes there (a code block's code; until step 11, a
      to-do item's tick box and a table's column list); an attribute the page reads, to write its
      own way (a cell's `align`, as `text-align`), for another element (a column's width, for its
      cells) or leaving out its default (`colspan="1"`); a class name its setting reads (a
      colour's); spaces the page takes out (a bold space at a line's end); what the page tells an
      element by (`data-type="taskList"`). A style the page only turns into a mark (bold from
      `font-weight` on `<em>`) isn't kept, so it's refused, for now. An element nothing is written
      for is refused: bold in a code block, but also bold in bold, a `<br>` in a code block and an
      empty link.
    - A table's column widths (`<col width>`) are kept as the cells' own, as TipTap keeps them.
      The page took them out (since 1f7835e), so a table from elsewhere would fit its column; one
      wider than it now makes the page scroll sideways, the layout's to fix (owner, 2026-10-27;
      `sf-system-todo.md`, "Layout").
    - Where: TipTap's check first, as before (an element it doesn't know, a value a setting can't
      take, which now says what it takes), then `cantKeep.ts`: it reads the code with the page's
      rules, writes it back as the page does, and compares each element with what was written for
      it. It names the first thing in the code, and how many more.
8. **Wrap selection keeps the blocks between.** With A and C chosen and B between them, Wrap
   selection put A and C in a quote or Card and deleted B without a word (Undo brings it back): it
   replaced everything from the first chosen block to the end of the last
   (`defaultItemsMultiSelect.ts`). The chosen blocks go into the new block where the first was,
   and B stays, after it, with a cursor in it, as the Move tools gather the chosen blocks and leave
   the rest; the boxes offered are those the page can hold there with B after (`selWrapPlace`).
9. **What a copy holds, and where it goes.** Text from inside a heading, a code block, a list or
   to-do item or a quote, pasted or dropped at a line's start or into an empty line, made the line
   that kind with the copied block's class and style, its own gone: ProseMirror copies the line
   around the text. Text across lines gave the second half of the line the copied line's kind,
   class and style, and a quote's line pasted into a quote split it. Now (`copyAndPaste.ts`), for
   paste and drop alike, text from inside one line is copied as a plain line's text, and joins the
   line, which keeps its kind and settings; so do plain text and one plain line from another app,
   wherever they land. Copied lines go in as they were: inside a line, it splits as
   Enter splits it (the top half keeps everything, the second half gets its class and style), and
   the cut first and last lines join the text beside them; at its start the copy goes above the
   line, at its end below, and in place of an empty line. In a list each line becomes an item, as
   typing them with Enter would, and a copied list's items join it; the item pasted into keeps
   itself. A block copied whole pastes as before; in code, everything is text.
    - New: all of a heading's text pasted into an empty line gives a plain line (the heading is
      copied as a block); another app is given a plain line's text for part of a line; text over a
      block selected whole gives a plain line, as typing does; lines dragged into code are text,
      as pasted.
10. **A span's text survives a change of kind.** Code Block, a code fence typed, and Backspace or
    Delete into a code block delete a span with its text; bold and links keep their text.
    ProseMirror clears what a code block can't hold (`clearIncompatible`).
11. **The code view writes the page as the page does.** It had a writer of its own
    (`htmlBlueprint.ts`), a partial copy of the page's blocks: with coloured text or a font it
    wouldn't open, and it wrote a video's start where the page doesn't read it, so an edit there
    lost it. It's now the page's own writer, as a copy is written (`codeViewHtml.ts`), leaving out
    what every block of its kind has (a link's `target="_blank"`, a Stack's `align="stretch"`), but
    not what tells its kind (`data-type="taskList"`). Done before step 8 (owner, 2026-10-28).
    - A block's HTML holds each of its settings once, as a component's does, and what it draws
      from them is drawn (step 6's rule). Two blocks wrote a drawing beside the setting, which the
      page doesn't read, so in the code view a tick or a width changed there did nothing: a to-do
      item its tick box (its view draws it, as before), a table its column list (its view draws
      it now, as TipTap does, again with each change, so a column added no longer leaves the widths
      where they were). A video's start is written in its address only (`youtubeExtension.ts`),
      where TipTap writes it for a `watch?v=` address.
    - New: a copy pasted into another app has no tick boxes or column widths (step 6 kept the
      boxes); an app built on TipTap reads both. A tick box or a column list as a style written in
      the code view is refused. A video's address is written in the page's form
      (`…/embed/…?start=30&rel=1`).

Later, the owner's call:

- Keeping HTML comments written in the code view (owner, 2026-10-18: not now).
- Pasting warns of what the page can't keep, as the code view does (owner, 2026-10-27).
- Keeping a style the page turns into a mark (`font-weight: bold` on `<em>`), which the code view
  refuses for now (owner, 2026-10-27).
- A copy pasted into another app shows tick boxes and column widths (owner, 2026-10-29).

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
- **A block's own look is drawn, never one of its settings** (owner, 2026-10-22), as a
  component's is, so copying, the code view and the saved page need nothing of their own. Each
  block sets its look up with the rest of it, and one extension draws them all. It replaces
  copying the code view's version (2026-10-18), which left a heading's class saved and another
  app without a to-do list's tick boxes.
- **The code view's check adds to TipTap's, not repeats it** (owner, 2026-10-23). TipTap refuses
  an element it doesn't know and a value a setting can't take; a block's list of settings drops
  any other attribute without a word, even from the saved form, and no TipTap option reports it.
- **What's kept is what the page writes back or reads** (owner, 2026-10-27): the check watches
  which attributes the page's rules read, in place of rules of its own for defaults, alignment and
  column widths, which three reviews found faults in.
- **One rule for anything lost, no table's own** (owner, 2026-10-27): a table's column widths are
  kept as TipTap keeps them, rather than taken out by a rule of the page's.
- **The code view writes with the page's writer** (owner, 2026-10-28): its own had drifted from
  the page's, and a writer that describes no block can't. What every block of its kind has is
  left out.
- **A block's HTML holds each setting once; what it draws, it draws** (owner, 2026-10-29), as a
  component's does, rather than the code view writing two blocks its own way: the tick box and the
  column list were written beside the settings they draw, so editing them in the code view did
  nothing. Copies to other apps go without them for now.
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
- **Wrap selection puts the chosen blocks in the new block where the first was; the rest stay,
  after it** (owner, 2026-10-30), as the Move tools gather the chosen blocks: a block not chosen
  is neither deleted nor put in a box the author didn't ask for.
- **Text pastes as text; copied lines go in as they were, the line split as Enter splits it**
  (owner, 2026-10-30): a line that text is pasted into keeps its own kind and settings, as with
  text typed in. One rule for every copy, paste and drop, settled as a spec of every case before
  any code: fixing text from one line alone would have left text across lines, which a list
  copied by its items' text needs as lines. Refusing the paste, or putting the text above or
  below the line, was weighed: a paste is too basic to refuse, and the cursor is where the author
  wants the text.
- **In a list, pasted lines become items, as typing them with Enter would** (owner, 2026-10-30,
  for now): a copied list's items join the list, and the item pasted into keeps itself, wherever
  in it the cursor is.
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

- **Step 6 done** (2026-10-22). Planned first as copying the code view's version; the owner chose
  drawing each block's look instead, as a component's template draws its own, so copying, the
  code view and the saved page need nothing of their own. Each built-in block sets up its look as
  its `ownLook` (the quote and the lists, now extended outside StarterKit; the code block, the
  to-do item, the table, the heading), and `OwnLook` (`ownLook.ts`) draws them as decorations,
  again with each change, in the page editor, on visitors' pages and in the code view's own code
  block. The heading's class-writing plugin is gone, and the demo page's headings lose their level
  classes; a table is written with its own style only, and loses `tiptap-table`, which nothing
  styled. `@tiptap/core` and `@tiptap/extension-blockquote` join the client's dependencies (a
  block's `ownLook` is typed on TipTap's core; the quote is extended). Measured in Chrome: a copy
  saves nothing the editor drew, and drawing costs nothing measurable per change, on the test page
  or one ten times its size. One check in `editor.spec.ts` and one in `app.spec.ts`, each of 15
  parts failing its own rows without it. The plan and the code were each reviewed by an agent;
  every finding checked: a row added for a table whose columns all have widths, one dropped that
  an older check covers. New: a heading with an `sf-heading-*` of its own is drawn by it, and any
  other block keeps one (a validator rule is listed in `sf-system.md`); a block's classes are kept
  as written (the heading plugin rewrote every block's spacing); a table's width follows its
  columns; the look comes after a block's own classes, so two lines of the demo layout snapshots
  changed, their boxes the same. Unit tests pass (4 + 34); all 668 runs of the Playwright checks
  pass. Found, outside this step: a copied block's style comes back as the browser writes it
  (`color: red;` for `color: red`), as ProseMirror writes styles through `style.cssText`.

- **Step 7 done** (2026-10-27). Leaving or saving from the code view refuses code the page can't
  keep, naming the first thing and how many more (`cantKeep.ts`). TipTap reads the code first, as
  before, refusing an element it doesn't know and a value a setting can't take, which now says
  what it takes. The check then reads it with a copy of the page's rules that notes which element
  each block and mark came from and which attributes the rules read, writes it back as the page
  does, and compares each element with what was written for it: what's missing is kept if the page
  read it. Measured in Chrome: what the plan named is refused, and so is the rest found dropped
  (`cite`, `reversed`, a link's id, classes on bold or inline code, a span's other styles, a Card
  attribute it doesn't have, bold in a code block, comments); the test and demo pages' own code
  reads back. Leaving takes 50-70 ms on the test page, about 270 ms on ten times it, 45 ms for a
  pasted table of 1,000 cells that loses something in each. Checks in `editor.spec.ts`: refused
  code with its message, code the page rewrites itself, and the pages' own code; each part fails
  its own rows without it. Reviewed by agents four times, and the rule's design once. The first
  check told rewritten from lost by rules of its own (a default, a bare element, taking things out
  and reading the page again); the reviews found the page's own code refused (an aligned cell, a
  bold space at a line's end, a see-through theme colour), losses let through (a to-do ticked
  only by its tick box, a second column's width, everything once a value read as "not a number"),
  and seconds to leave: the rule is now what the page reads. An error while the page took the
  code said only "Something went wrong"; messages fixed (a dropped element shown as written,
  quotes, a style's properties as written). New, the owner's calls: a table's column widths
  (`<col width>`) are kept, as TipTap keeps them; the page took them out (since 1f7835e) so a
  table from elsewhere fit its column. A style the page only turns into a mark (`font-weight` on
  `<em>`) is refused, for now (plan, "Later"). Unit tests pass (4 + 34); all 688 runs of the
  Playwright checks pass. Found, outside this step (`sf-system-todo.md`, "Editor" and "Layout"): a
  table wider than its column makes the page scroll sideways (now reached by pasted widths); the
  code view's writer has no colour or font mark, so a page with coloured text can't open it, and
  writes a video's start where the page doesn't read it, so it's lost after an edit there; a
  theme colour comes back from the code view as a style; a span block with a colour is read back
  as coloured text; a table's drawn column widths don't follow a column added; a table in a table
  gives its widths to the outer cells; the code block's highlighter has no bash; the check goes by
  names and elements, so a value the page reads but can't take (`<td align="justify">`) or a mark
  lost on part of an element's text (bold on inline code) isn't refused. Parked: pasting warns of
  what the page can't keep, as the code view does (plan, "Later").

- **Step 11 done** (2026-10-29), before step 8. The code view writes the page with the page's own
  writer, leaving out what every block of its kind has (`codeViewHtml.ts`); its own writer
  (`htmlBlueprint.ts`) is gone. Measured in Chrome: with coloured text or a font the code view
  didn't open, and a video's start was lost after an edit there. Now every block and mark, with
  each setting on its own (151 cases), comes back through it but the six known (`sf-system-todo.md`,
  "Editor"), as do both seeded pages. The first review found the code view showing a to-do item's
  tick box and a table's column list, which look editable but the page doesn't read: the owner
  chose one rule, that a block's HTML holds each setting once and what it draws it draws. The
  to-do item is written without its tick box (its view draws it), the table without its column
  list (its view draws TipTap's, `DrawnTable`, again with each change), a video's start only in
  its address. Tables are drawn as TipTap's column list draws them (20 of 20, Chrome and WebKit),
  and a column added no longer leaves the widths where they were; the demo page's snapshots are as
  committed. The code view's check keeps a column list for the widths its cells read, and a `<col>`
  with no width, but not what's around a table. The second review found that drawing each cell's
  width as its look overrode a cell's own `min-width` (the table's view replaced it), and the
  check's first rule for column lists both too wide and too narrow (fixed); the third, that the
  view kept outside changes to the table on screen (now redrawn, as before). ProseMirror's check
  against a setting written as HTML holds in the code view's writer (shown with a block written
  so). Checks: in `editor.spec.ts`, what the code view writes for each kind and that it comes back,
  and the changed rows; in `blocks.spec.ts`, a table's widths after a column is added (T3 on the
  test page); each part fails its own without it. Unit tests pass (4 + 34); all 696 runs of the
  Playwright checks pass. New, the owner's calls: a copy pasted into another app has no tick boxes
  or column widths (plan, "Later"); a tick box or a column list as a style written in the code
  view is refused. Found, outside this step (`sf-system-todo.md`, "Editor"): a video whose address
  isn't YouTube's shows nothing and loses it on an edit in the code view; a video's address comes
  back in the page's form, and a start on a `youtu.be` or `/embed/` address is lost there; a cell
  aligned by its setting alone gets `text-align` in its own style once copied; a short first row
  gets its missing cell first; a pasted column list's widths can land on the wrong columns.

- **Step 8 done** (2026-10-30). Wrap selection puts the chosen blocks in the new block where the
  first was, and the blocks between stay, after it; the kinds offered are worked out from the same
  result (`selWrapPlace`). Measured in Chrome: with A and C chosen, B was deleted (Undo brought it
  back). The other chosen blocks are taken out, then the first is replaced (`selWrap`), so a block
  between isn't touched: a cursor in it, or it selected, stays. Otherwise the selection lands as
  before, in the new block or on the block after it (14 cases, side by side and with a gap). The
  same kinds are offered as before, in 16 places (the page, a Card, Columns, a Stack, a quote, a
  list item, a to-do item, a table cell), Chrome and WebKit. A check in `editor.spec.ts`; each
  part fails on a version without it, and the Undo and side-by-side parts pin what already worked.
  Reviewed by an agent; its findings checked: rewriting A to C in one change moved a cursor out of
  B (fixed; taking every chosen block out instead, as the Move tools do, moved a selection on the
  first out of the new block), and only the check's first part failed without the fix (extended).
  Unit tests pass (4 + 34); all 700 runs of the Playwright checks pass.

- **Step 9 done** (2026-10-30). Planned first for text from inside one line alone; the owner wanted
  one rule for every copy, so a spec of every case came before the code: 255 cases, 15 kinds of
  copy in 17 places, the list rule settled on the way. Today's paste did as the spec says in 152 of
  them; now all 255, in Chrome and WebKit, one Undo each, the cursor where it was; dragged, the
  same, a moved line keeping its id (step 2). Copy, paste and drop in one place (`CopyAndPaste`,
  last, so a block's own paste goes first: code from VS Code). Two checks in `editor.spec.ts`; each
  of 21 parts fails on a version without it. Reviewed by an agent; its findings checked and fixed: a
  picture, line or video between copied lines was lost in a list (it goes in the item before); a
  Card, Stack, Cover or column whose only line was empty went with it (the copy goes in after the
  line, which then goes); plain text into an empty heading, or over all its text, made it a plain
  line (a plain line alone is text); a copy from inside one line lost ProseMirror's mark, so spaces
  went and paste rules ran (`**bold**` turned bold); the cursor went too far after a copy from a
  line's end; a cell's text left its table. Unit tests pass (4 + 34); all 708 runs of the
  Playwright checks pass.

Next: step 10, in a session of its own.
