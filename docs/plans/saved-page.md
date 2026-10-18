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
   item out of a list or quote gave both halves its id (Enter did too: step 1). An id is for one
   block: when a change leaves an id on more blocks than before, and a block that was already
   there still has it, the blocks the change put in go without it. A block is put in when the
   change writes it anew: a paste, a drop, a list split in two, but also a block moved, wrapped
   or changed. Those leave the id on as many blocks as before, so the rule leaves them. The page
   is read only when a block put in has an id, so typing costs nothing; no list of ids is kept
   alongside the page.
    - Ids the author writes are kept as written, even two the same. The code view and opening a
      page replace the whole page, so no block in it was already there. The Attributes panel
      saves its changes as settings of the block that's there; today it writes the block anew,
      which the rule would take for a copy. Undo and redo put back what was there, so the rule
      leaves them. When every block with the id was written anew, the rule can't tell which was
      there first and leaves them all. Two blocks with one id get a validator rule, "two blocks
      share the id …", added to `sf-system.md`, "Validator and linter".
    - Where: one rule run after each change, in the extension that gives blocks their id
      (`allowAttributesExtension.ts`). Copies come from many places (paste, drop, the drag
      handle's copy, a list or quote split in two), so no one command owns them.
    - The cases, each a check in `editor.spec.ts`:

        | Change                                                                                       | The id ends up on                                                                          |
        | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
        | Paste a copy of a block (a paragraph, a Card, a table, a to-do list)                         | the block copied, not the copy                                                             |
        | Drop a copy (dragged with Alt, or the drag handle's copy)                                    | the block copied, not the copy                                                             |
        | Select a block, cut it and paste it                                                          | the pasted block                                                                           |
        | Select a block's text (not the block), cut it and paste it                                   | the empty line left behind, not the pasted text                                            |
        | Paste blocks from another app or page                                                        | each, unless the page has it; the first block joins the line at the cursor and its id goes |
        | Drag a block to move it                                                                      | the block, moved                                                                           |
        | Enter anywhere in a paragraph, heading, list or to-do item                                   | the block it was pressed in, as step 1 says                                                |
        | Take an item out of a list or quote (Backspace, Enter on an empty item, Shift-Tab, a button) | the top half, or the list left when it's the first item                                    |
        | Join two blocks with Backspace or Delete                                                     | the first; the second's goes. If the first is empty, the second                            |
        | Add a table row or column                                                                    | nothing new: the new row and cells have none                                               |
        | Wrap or unwrap a block, or change it with Change Type                                        | the block                                                                                  |
        | Give a block an id another has, in its Attributes panel (paragraph, picture, video, line)    | both                                                                                       |
        | Write two blocks with one id in the code view                                                | both                                                                                       |
        | Two blocks the author gave one id: move, wrap, change or type in one                         | both                                                                                       |
        | Two blocks the author gave one id: cut one and paste it                                      | the other: the page still has it                                                           |
        | Undo, redo                                                                                   | as it was before the change, or after                                                      |

3. **Changing a block's kind keeps what the author set.** Four ways of changing a block's kind
   take its id and class off: Numbered List on a bullet list (TipTap's `toggleList`), Task List
   on a list (the app's `switchListType`, `defaultItemsBlock.ts`), a heading made from more than
   one selected paragraph (TipTap's `setNode`), and a list made from a heading (TipTap's
   `clearNodes`). Change Type keeps them. Where it's fixed is found when the step is planned.
4. **Copying takes the code view's version.** The editor draws some built-in blocks with classes
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
5. **The code view refuses what the page can't keep.** Leaving the code view dropped without a
   word a paragraph's `title`, `lang`, `data-…` and `onclick`, and HTML comments (a link's
   `title` was kept). An unknown element is refused today; so is anything else the page can't
   keep: the code view stays open and says what and where ("The page can't keep `title` on
   `<p id="…">`"). It asks only whether each element and attribute the author wrote is still
   there, so what the page adds or rewrites itself (spaces, attribute order, a link's `rel`)
   never refuses their code. Some things have to go (`onclick` runs code): the author takes them
   out. Comments are refused too, for now.

Later, the owner's call:

- A heading's level class (`sf-heading-2`) is saved on every heading and shows in the code view.
  f0b5f39 saved it because drawing it the way lists are drawn ran into step 4's bug. After step 4
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
- **Changing a block's kind is a step of its own** (owner, 2026-10-18): it loses ids, it doesn't
  copy them.
- **Copying takes the code view's version, not the page as drawn** (owner, 2026-10-18).

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
  of kind lose a block's id and class (now step 3). The reviewer found that builders where
  authors write the ids mostly only flag duplicates (Webflow, WordPress); here most duplicates
  come from the editor itself, so both steps stay, with the validator for what authors write.
- **Plan signed off** (2026-10-18), with the decisions above.

Next: step 1, in a session of its own.
