# Plan: the saved page is what the author made

Three ways the saved page (the editor's JSON) ends up different from what the author made, shown
in Chrome on the test page (`/editor?seed=tests`). Each is fixed once, where it happens, not per
block, and each step is a session of its own. Deleted when done, as every plan is.

## Plan

Each step runs as `.claude/skills/ship-step/SKILL.md` says.

1. **One id, one block.** Enter at the end of a paragraph, heading, list item or to-do item gave
   the new block the same id, and so did pasting a copied block. When a change adds a block with
   an id the page already has, the added block goes without it; the one already there keeps it.
   A block cut and pasted keeps its own, as the page no longer has it.
    - Not in the code view, where the author writes the page: ids are kept as written, and two
      blocks with one id get a validator rule, "two blocks share the id …", added to
      `sf-system.md`, "Validator and linter".
2. **Copying takes the code view's version.** The editor draws some built-in blocks with classes
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
3. **The code view refuses what the page can't keep.** Leaving the code view dropped without a
   word a paragraph's `title`, `lang`, `data-…` and `onclick`, and HTML comments (a link's
   `title` was kept). An unknown element is refused today; so is anything else the page can't
   keep: the code view stays open and says what and where ("The page can't keep `title` on
   `<p id="…">`"). It asks only whether each element and attribute the author wrote is still
   there, so what the page adds or rewrites itself (spaces, attribute order, a link's `rel`)
   never refuses their code. Some things have to go (`onclick` runs code): the author takes them
   out. Comments are refused too, for now.

Later, the owner's call:

- A heading's level class (`sf-heading-2`) is saved on every heading and shows in the code view.
  f0b5f39 saved it because drawing it the way lists are drawn ran into step 2's bug. After step 2
  it could be drawn only, as the level is the heading's own setting.
- Keeping HTML comments written in the code view (owner, 2026-10-18: not now).

### Decisions

- **Each fix is made once, where it happens, not per block** (owner, 2026-10-18).
- **A duplicate id the app would make isn't made; one the author writes gets a validator
  warning** (owner, 2026-10-18). The app doesn't change the author's content.
- **Copying takes the code view's version, not the page as drawn** (owner, 2026-10-18).

## Progress

- **Plan written** (2026-10-18), from probes in Chrome. Found, outside this plan: every link
  saves `rel="noopener noreferrer nofollow"`, which the author never wrote (TipTap's default);
  `nofollow` tells search engines not to follow the site's own links. Raised.

Next: step 1, planned with the owner.
