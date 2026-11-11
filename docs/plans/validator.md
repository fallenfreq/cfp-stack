# Plan: the validator, for page builders

The rules the system relies on that nothing checks yet are in `client/src/assets/sf-system.md`,
"Validator and linter", each with its reason in the section it names. This plan builds the part
for page builders: warnings on the blocks in the editor. Each step is a session of its own.
Deleted when done, as every plan is.

## The shape

Agreed with the owner, 2026-11-01. Three pieces, each with one job, built and checked alone, then
joined:

| Piece                    | Takes             | Gives                                           |
| ------------------------ | ----------------- | ----------------------------------------------- |
| The core                 | elements and CSS  | results                                         |
| The page reader          | the page's blocks | hast elements, each tied to its block and style |
| The block view's display | results           | marks on the blocks                             |

- **Elements, CSS and results** are defined in `client/src/assets/sf-system.md`, "Validator and
  linter", "The shape". Every display takes the same results.
- **Joined:** the block view runs the page reader, the core, then its display.

## Plan

Each step runs as `.claude/skills/ship-step/SKILL.md` says.

1. **The spec's rules, sorted by what they read.** "Validator and linter" is rewritten: the
   rules sorted into those that read elements (a page's blocks, a screen's template), CSS (a
   theme's rules, a component's styles, a block's own style) and a component's code; where each
   kind runs (the editor now; later an IDE linter for code in files, and a theme's save once
   there's a theme editor); and the shape above, which outlasts this plan. Settled with the owner:
    - Each rule's name (new vocabulary).
    - One list of what counts as a layout, for "one layout per box", a component's own included.
      The rule for plain boxes and the one for component blocks disagree on `sl-row`, and the
      Centre's own root is `sl-center sl-stack`. The fixed CSS has one list of layouts already
      (`GAP_LAYOUTS`, `slLayout.ts`), without `sl-center`: the candidate.
    - `sl-hide-below-*` on an app screen with no layout around it reads elements, not a
      component's code. No app screen is in the editor, so it waits for the IDE linter.
    - Container units and `overflow: hidden` are listed for one writer, but their reasons hold for
      any CSS. "Don't give the root a height of its own" (Component blocks) has no rule.

    The to-do's entry for the validator then says what this plan builds and what's left for later,
    and its "Current state" points here.

2. **The core.** Elements in, results out: the two formats, running the rules, and the first
   rule, two elements with one id, which needs no list. The CSS the CSS rules take is settled
   with them, in step 4. It reads nothing of the editor's, so the
   IDE linter can use it later; where it lives (the client, or `shared/`) is settled in the step.
   Checked by unit tests run by `pnpm test` (`node --test`, as the API's are), elements in and
   results out.
3. **The layout rules:** one arrangement per box, a centred column that bleeds, and a collapsing
   layout straight in a side of a split. They read the fixed CSS's lists of layouts and classes
   (`GAP_LAYOUTS`, `COLLAPSE_HOST_SELECTOR`, `COLLAPSE_CLASS_SELECTOR`, `slLayout.ts`), not a
   copy. One arrangement per box reads `GAP_LAYOUTS` and `sl-scroll-frame`, which isn't on it
   (where that pair lives is settled in the step). The split rule reads which layouts a
   collapsing block measures (`COLLAPSE_HOST_SELECTOR`,
   which has `sl-center` but not `sl-row` or `sl-cover`), not the arrangements. Those lists are
   the API's today, so what they're made from moves to `shared/`, as the slug rule did, and both
   read it. `shared/` becomes TypeScript first, used as is as `validator/` is (tried with the
   slug rule, 2026-11-02: the API's and the client's checks, builds and tests, and Cloudflare's
   bundle, all pass), with a type check of its own (extending `tsconfig.base.json`, as
   `validator/`'s does) and the API's
   `rewriteRelativeImportExtensions`, without which the API's check refuses one of its files
   importing another (`./slug.ts`).
4. **The other rules for a page:** a picture with no size of its own (the sizes that count are
   in "A picture's space before it loads"), `sf-heading-*` on a block that isn't a heading or
   twice on one, and the suggestions: `sl-center` on a video, and a long run of side-by-side
   blocks that each hide or show (how long is settled in the step). Then the rules that read CSS
   and can break in a block's own style: `no-container-units`, `require-channel-fallback`,
   `no-width-container`, `no-overflow-hidden` and `no-content-sized-box` (what sizes by content,
   a flex row or `fit-content`, is settled in the step). A theme's rules and a component's styles
   will run them too, so they read CSS, not the editor's style; how a block's style is read is
   settled in the step. Their results name CSS parts, so `ValidatorResult`, which names elements
   today, takes what's involved as a type.
5. **The page reader.** The page's blocks as hast elements, each tied to its block's position,
   as a result names the elements themselves. The page is the content tree the rules are written
   for, so there are no content boxes to step through: those are only on screen. Each block is
   read from the HTML the page writes for it, every setting included (the code view leaves out
   those at their defaults), through hastscript's `h()` (7.3 KB gzipped): a new block reads with
   no code of its own, and classes come out as the rules read them (hast built by hand with
   HTML's names, `class`, type-checks but no rule finds its classes). So a video keeps its mark
   (`data-youtube-video`), a picture its width and height, and a component block its name
   (`layout-card`), which the rules read. Text and its styles (bold, a link, a colour) aren't
   read: no rule reads them.
    - **The classes a block always wears.** An element also wears them, though the page doesn't
      save them, and never what the editor draws only while you work (the selection;
      `sf-on-selected`, a system class, on blocks chosen together). A built-in block's are its
      own look (`ownLook`: a to-do item is `sl-split sf-gap-md`). A component's are read from
      its drawn box (Decisions, 2026-11-10): the box puts them together with what it's given,
      the page builder's classes and the editor's, so it alone can tell them apart, and works
      them out each time it's asked (`componentBoxes.ts`). Nothing is kept, so nothing goes
      stale. They're asked of the page the editor shows, once drawn. Measured on the test page
      (2026-11-10): exact for all 90 component blocks, a setting's class included (the Stack's
      `sl-align-x-center`), with blocks selected and chosen together, and up to date in the same
      moment as a change, a new block included.
    - **Separate pieces.** The reader is given the classes each block always wears, so it knows
      nothing of drawing, and is tested in Node on the editor's own blocks: the client's first
      quick tests, run by `pnpm test` as the others are, with a small loader for the editor's
      `@/` paths and its components' `.vue` files. There, each component's drawn classes are
      given in place of its box, found by its block's position. A component's own classes were
      measured in the browser; a layout check follows in step 6. Its test runs a class rule on
      what it builds.
    - **Styles.** Each block's own style goes through the core's `readStyle` to the CSS rules;
      `no-overflow-hidden` and `no-content-sized-box` run only on a block that holds blocks,
      not text (a plain box, a quote, a component block, a list and its items, a table, its
      rows and its cells).
    - **Packages.** The client gets hast's types of its own, as each unified package has, and
      the validator, for `readStyle`; `pnpm typecheck` then checks the client when `validator/`
      changes (`scripts/typecheck.mjs`), as it does for `shared/`.
    - **A to-do item is a Split** by its own look, so `no-collapse-straight-in-columns` warns of
      a collapsing layout straight in one, which stacks late by the tick box (29px, measured).
      Kept with the owner, 2026-11-10: it's true, a Stack around the layout fixes it, and leaving
      it out would take code for to-do items alone. An inset is left out by not being one of
      the rule's column layouts.
6. **The block view's display.** Joins the page reader and the core
   (`client/src/editor/extensions/pageWarnings.ts`): after each change to the page, straight
   after it's drawn, the rules run on the page the view shows, a component's classes read from
   its drawn box (`blockWears` with `componentClassesIn(view)`). What a page builder sees:
    - **A mark on each block a rule names:** an outline in the theme's warning colour, dashed
      for a problem and dotted for a suggestion, which moves nothing on the page; a selected
      block shows its selection instead. It's the editor's own (`has-problem`,
      `has-suggestion`), never saved, and the rules don't read it.
    - **Why, in the block's Attributes panel,** above the rows where most are fixed, its button
      in the warning colour: each warning's message and rule, and the classes the block wears by
      itself, which no row shows ("Comes with this block: sl-stack"). So a warning appears or
      goes as a change typed in the class row applies. An inline piece's warning (a span's
      style) shows on the piece and on its line, as the toolbar is mostly on the line.
    - **The node path** shows the blocks around the cursor that have one, and **the top bar's
      count** selects the next block with one, in the middle of the screen (a block taller than
      that leaves room for, its top under the bar and its toolbar).
    - **Save** is as it was: it never waits for warnings or stops on them, and nothing toasts (a
      toast says something happened; a warning stays until it's fixed).
    - **Loading:** the rules, the reader and CSSTree are a file of their own
      (`client/src/editor/pageRules.ts`, 68 KB gzipped), loaded just after the editor opens; the
      editor's own is 647 KB. ESLint refuses anything but their types elsewhere in the client.
    - **Messages** name what the page builder can see. `no-collapse-straight-in-columns` names no
      class, as the layout around may be a block's own (a to-do item is a split); the classes
      a block wears by itself are in its panel.
7. **The cursor across the code view.** Found while planning; not part of the validator
   (`client/src/editor/codeViewCursor.ts`). It was: the code view opened on line 1 wherever the
   cursor was, and leaving it after any edit put the cursor at the very end of the page. Now the
   cursor goes to the same place in the other view, or the nearest the other has, its line at
   the same height on the screen (just under the top bar if it was off the screen):
    - **Going in:** a cursor or selection in text, at the same place in the code; a selected
      block, as its whole code selected; another selection (table cells, the whole page), as the
      text nearest its ends.
    - **Coming back:** a place in text, at the same place on the page. In a tag, just outside it:
      before an opening tag (that block: the start of its text, or a picture or video selected),
      after a closing one (the end of the block it closes). Elsewhere, toward the tag next to it
      on its line: the end of the block that tag ends (a closing tag just before or after it, a
      picture's just before it), else the start of the next. A selection of exactly one block's
      code selects that block, with its toolbar; one of exactly a run of text, that text. Select
      all selects the whole page. Code the page can't read keeps the code view open, its cursor
      where it was; a place in a character code (`&amp;`), which no marker can go in without
      changing it, leaves the page's cursor where it was.
    - **How:** each way a marker goes where the cursor is, and the page converts as it always
      does. Going in, characters in the text of a copy of the page, or for a selected block one in
      its id. Coming back, a character in text, as going in, and a comment between tags, which the
      browser keeps where it's written (in a table too, where it moves text out) and the page
      leaves out. The characters are ones the code doesn't hold, from Unicode's private use (where
      an icon font's glyphs are, which a page can hold). Where each tag and text is in the code,
      which the page's own reading doesn't keep, is parse5's, which reads HTML as the browser does
      (43 KB gzipped, loaded as the code view opens). An unchanged selection isn't set again, as
      that would drop the marks set for what's typed next (bold turned on at the cursor).

### Decisions

Owner, 2026-11-01:

- **The editor's blocks only.** Later, in the to-do: the IDE linter ("Bigger work"), for
  developers writing pages and components in files, which also carries the CSS rules on a
  component's styles and the component's code rules, and which the component store runs when a
  component is added; the check when a theme is saved, once there's a theme editor; and
  underlines in the code view ("Ideas, not decided"), since the warnings show on the blocks once
  you leave it.
- **Not built:** checking the page as drawn (the IDE linter covers code in files; one exception,
  2026-11-10, below), and a check on the server when a page is saved (warnings are for the
  person editing).
- **ESLint's shape, not ESLint.** ESLint reads only text, so the blocks would go through code and
  back, and the editor would carry ESLint. The IDE linter will be a thin ESLint plugin: each of
  its rules calls the core, ESLint's Vue and HTML parsers read the code, and ESLint shows the
  results and holds the settings.
- **Not written twice:** a rule's reason (the spec section it names), the lists of layouts and
  classes (the fixed CSS's), and ids on copies (the editor already takes the id off a copy it
  makes; the rule is for ids the author typed).

Owner, 2026-11-02:

- **A rule shows wherever its problem can happen.** So the editor also runs the rules that read
  CSS on a block's own style (step 4). `no-hide-show-without-layout` can't break in a page, so
  it's the IDE linter's only: in a page, hide and show measure the page wherever the block sits
  (measured in the editor: at the top, in a plain box and in a Card).
- **A scroll frame counts for one arrangement per box.** The spec already has it wrap one scroll
  area; nothing caught a frame worn by a layout. Columns that are also a frame are one column
  (measured with the fixed CSS: 3 × 200px alone, one 600px column with the frame).
- **`no-content-sized-box` replaces `no-content-sized-slot`,** for any CSS on a box that can hold
  blocks, the editor running it on a block's own style. Measured in the editor: a Stack holding
  collapsing Columns is 0 wide in a box styled `display: flex`, and 67px in a cluster, a spot the
  system knows.

Owner, 2026-11-10:

- **A component's own classes are read from its drawn box,** the one thing the editor reads from
  the page as drawn. The page saves only what the page builder chose (`<layout-stack
class="sl-inset">`), and the built component holds its own classes (`sl-stack`) only as
  drawing code. Each place reads them where it can see them: the editor from the drawn box, the
  IDE linter from the component's file. A list of each component's classes would repeat the
  component; reading its file when the app is built wouldn't reach a component from the store,
  and reads a setting's class only as "might be set".
- **A component is checked inside once, when it's made or added** (the IDE linter), so a page
  needs only its outer box. A collapsing layout in a component with no layout of the
  component's own around it would measure the page around the block, so it gets a rule of its
  own for the IDE linter, `no-collapse-measuring-outside`.
- **A message names no block** (step 6). Naming a block's own class by the block would take
  every rule asking the editor about each class it names. The panel already knows its block,
  so it lists the classes the block wears by itself instead, and the one message that named
  the class of a block around (`no-collapse-straight-in-columns`) names none.
- **The cursor across the code view goes by one rule** (step 7): a marker carried through the
  page's own conversions, the cursor going where it lands; where a place outside text goes
  follows from it, with one rule for which way to look (toward the tag next to it on its line).
  No code for each kind of place. Coming back, the marker takes the form that doesn't change how
  the code reads where it goes: a character in text (a comment there split it, and TipTap's
  reader then dropped a line break left on its own, at the end of a code block's last line), a
  comment between tags (a character there was moved out of a table by the browser).
- **A selected block goes in as its whole code,** and a selection of exactly that code comes back
  as the block, so a block goes there and back as itself. The cursor at its tag would come back
  as its text.
- **parse5 says where the tags are,** not code of our own, nor Prettier's reader. A count of tags
  holds only while nothing but a tag has a `<`, which code typed in the code view needn't keep
  to; Prettier refuses code the page reads (156 of 446 random edits of the test page, measured).
  parse5 reads HTML as the browser does and never refuses. The browser alone could tell a place
  in a tag on the way back (reading the code up to it drops an unfinished tag), but not a
  block's code going in.

Checked while planning: no HTML linter fits as the core. html-validate, which runs in a browser,
also reads only text (`validateString`, `validateSource`).

## Progress

**Step 1** (2026-11-02). The spec's "Validator and linter" is rewritten: the shape, where a rule
shows (wherever its problem can happen), and the rules by what they read, each named; "Layout
primitives" has "One arrangement per box", with why the Centre is `sl-center sl-stack` (as it
has been since 8475aff, 2026-09-30, which gave no reason). Settled with the owner: the names, the
arrangements, the CSS rules on a block's own style in the editor, `no-content-sized-box`.
Measured: hide/show in a page measures the page, so `no-hide-show-without-layout` is for screens;
`height: 100%` fills a row either way, so `no-root-height` was dropped and the spec's line logged
in the to-do. Checked: `pnpm test`, Prettier. An agent's review found 8, all confirmed: 6 fixed in
the text (the core reads CSS too, a theme's save refuses a bad selector, the alphabet claim, the
`container` shorthand, one home for the shape, a citation), 2 settled with the owner (a frame on a
layout, which the spec already ruled out but nothing caught; a box sized by its content).

**Step 2** (2026-11-02). The core is a package of its own, `validator/`: TypeScript used as is,
taking nothing from the client or the API, as a theme's save may check on the server and the
platform may be split from the site. `shared/` was weighed and left: plain JS with types written
by hand, and meant to stay free of dependencies. Elements are hast, the standard HTML tree, not
a format of our own (1.5 KB gzipped with unified's walker; hast's selector tool, 17.5 KB, left
out). Rules report as ESLint's, stylelint's and unified's do; a result names the elements
themselves and its type is ESLint's. A rule's reason isn't in the code: its name is its spec
entry, which names the section. Held by the type check (`@tsconfig/strictest`, the client's
ES2022, `test/types.ts`), ESLint (no casts, `any` or `!`; a rule's `check` a function) and tests
written as HTML. Settled with the owner: the package, hast, the names, the type names, dropping
`reason`. Checked: `pnpm test` (each fault a test guards against shown failing),
`pnpm typecheck --all`, ESLint, Prettier. Two agents' reviews, 8 findings each, all confirmed
and fixed; the second checked the design against ESLint, stylelint and unified-lint-rule and
found it fits every rule in the spec's list. Noted for later: the client's type check on a
change to `validator/` (step 6), results naming CSS parts (step 4), building hast in the page
reader (step 5). Left: an import ending in `.js` for a `.ts` file passes the type check, and
Node refuses it once a test imports the file.

**Step 3** (2026-11-08). The layout rules, each tested as HTML: `one-arrangement-per-box`,
`no-bleeding-center` and `no-collapse-straight-in-columns`, widened from splits with the owner.
Measured in Chrome, collapsing at 640px: Columns straight in a 295px split side, a 442px Columns
column and a 289px grid cell all stay side by side, and stack with a Stack around them. An inset
is left out: a layout straight in one stacks late only by its two margins (48px), the Columns
block too, as a component block is one box (the to-do's example corrected). The lists are
`shared/layouts.ts`'s, which the stylesheet's code reads too: `GAP_LAYOUTS`, `COLLAPSE_HOSTS`,
`COLLAPSE_PREFIX`, `COLUMN_LAYOUTS` and `COLLAPSING_LAYOUTS`, beside `ARRANGEMENTS` (the gap
layouts and the scroll frame). `shared/` is TypeScript used as is, with its own type check and
the strict ESLint block; `rewriteRelativeImportExtensions` waits until one of its files imports
another (its README says so). Settled with the owner: the wider rule and its name, the list
names, the setting left out. Checked: the stylesheet byte for byte; clean builds of the last
commit and this one (the client's identical, the API's apart from the two files changed);
Cloudflare's functions bundle; `pnpm test`, `pnpm typecheck --all`, ESLint, Prettier; each
fault a test guards against shown failing. An agent's review found 7, all confirmed: a message
false in a band (now the rule and its fix), a test passing a page with the problem, the setting,
a warning on a collapse class that does nothing (now `COLLAPSING_LAYOUTS`), doc text, a missing
Cluster case, and, for step 6, messages that name classes (`sl-columns`), not blocks. Not
followed by the collapse rule: a layout in a spot sized by its content, and a popover between.

**Step 4** (2026-11-08). Four rules on elements, `require-picture-size`, `valid-heading-class`,
`prefer-center-around-video` and `max-hide-show-run`, and five on CSS, `no-container-units`,
`require-channel-fallback`, `no-width-container`, `no-overflow-hidden` and
`no-content-sized-box`, each tested. CSS is CSSTree's tree (`@eslint/css-tree`, 57 KB gzipped),
read from a block's style by the core's `readStyle`; one rule type for both, a result naming
`nodes`, one `check()`. The lists the rules read are `shared/`'s, and the stylesheet's code reads
them too: `SHAPES`, `FILLS`, `HIDE_PREFIX`, `SHOW_PREFIX`, `CHANNELS`, and `HEADING_CLASS`
(`shared/headings.ts`, read by the heading block). Settled with the owner: the CSS reader, the
names, the channel rule for a larger value only, `contain` as a width container, what sizes by
content, 100 blocks. Measured in Chrome: each case `no-content-sized-box` names or passes (a box
holding a Stack that holds a collapsing layout); a hide/show run crossing a width, 2 ms at 100
blocks, 7 at 200, 23 at 400. Checked: the stylesheet byte for byte; Cloudflare's functions
bundle; the heading block in the editor; `pnpm test`, `pnpm typecheck --all`, ESLint, Prettier;
each fault a test guards against shown failing; the seeded pages (6 pictures with no size, 4 of
them the test page's own). An agent's review found 8, all confirmed: `no-content-sized-box`
flagged boxes with a width of their own and read each property alone (now the box's style is
read in order, shorthands included); the channels were written twice (now `CHANNELS`); a
channel as a fallback's whole value was flagged; three messages (container units, the video's
own style, a layout that holds a collapsing block). Settled with the owner: a picture sized by
its own style is still warned, so there's one way to give a size; a Card that frames a picture
takes a layout, as it always has (`a1d0f82`), so a Card with none is warned (measured in the
editor: of a plain box, a Card, a Card with a layout, the layout blocks and a quote, only the
Card with none lost its shape), and a Card that needs none is an idea in the to-do. Logged in
the to-do: the IDE linter would flag `sf-heading-2` on the prompt's label (`PromptModal.vue`).

**Step 5** (2026-11-10). The page reader, `client/src/editor/readPage.ts`: each block read from
the HTML the page writes for it through hastscript's `h()`, each element tied to its block, and
each block's own style read as CSS, marked where the box rules run; text and its styles left
out. Each element also wears the classes its block always wears (`blockWears`, `ownLook.ts`): a
built-in block's own look, or a component's, which its drawn box works out when asked
(`componentBoxes.ts`), never the editor's while you work. Settled with the owner: a component's
classes read from its drawn box, the one thing read from the page as drawn, over a list of them
(which would repeat the component) or its file read when the app is built (which a component
from the store wouldn't reach); hastscript; the client's own hast types; the client's first quick
tests, in Node with a loader for the editor's code; the blocks that hold blocks; the IDE linter's
`no-collapse-measuring-outside`; a to-do item still warned of as a Split. Measured in Chrome: the
reader matched the editor's own HTML element for element on the test page (528) and the demo page
(302), apart from styles the browser tidies (`color: red;`); each of 90 component blocks' classes
exact, with blocks selected and chosen together, and in the same moment as a change; about 2 ms
to read the test page once warm; Columns in a box with no layout in a Split side stack when the
whole Split is 640px (their side 312px), and in a to-do item 29px late. Checked: `pnpm test`,
`pnpm typecheck --all`, ESLint, Prettier; each fault a test guards against shown failing (13).
`pnpm test:ui`: 692 passed and 20 failed with the machine busy; on reruns they came and went,
and the same 34 checks gave the same 2 failures (a WebKit popover check, `anchorFallback.spec.ts`)
with and without this step's two editor files, so they aren't this step's. An agent's review found
9, all confirmed: a wrong position given to `blockWears` went uncaught, as the tests' helper
wrote its join again (now one `blockWears`, given what's drawn at each position, and the tests'
stand-in finds the block by it); the to-do item's decision unwritten; a component's classes
measured, not checked (a layout check in step 6); the stand-in silent for a component it lacks
(now it throws); registering a box again after a redraw served no lookup (now once); the boxes'
answers in a file of their own under the strict lint; a `.` in a store component's name (logged);
doc text (a save, not the code view; table rows; the rule's name; classes); a page builder's
classes split only at spaces (now at any). Logged in the to-do: the IDE linter reads a
component's file; the editor's list of components repeats their settings; `document` in the
blocks that take a style does nothing; a `.` or `#` in an alias.

**Step 6** (2026-11-10). The block view's display: after each change the rules run on the page
as drawn (`pageWarnings.ts`) and each block they name is marked; its Attributes panel lists why,
with the classes it wears by itself; the node path and the top bar's count find them. The rules,
the reader and CSSTree are a file of their own (`pageRules.ts`), loaded once the editor is open.
Settled with the owner: the marks, the panel, the path, the count, Save as it was with no toasts,
the separate file, `has-problem` and `has-suggestion`, and messages that name no block.
Measured in Chrome: reading the test page and running all 13 rules, 2 ms; a typed letter, about
5 ms in all; 9 blocks marked on the test page; a mark goes with a class change and comes back on
undo; the rules' file 68 KB gzipped, the editor's grown 1.2 KB; the marks move nothing (the demo
page's snapshot is unchanged once it leaves out the mark, as it leaves out ProseMirror's
classes). Checked: `pnpm test`, `pnpm typecheck --all`, ESLint, Prettier, `pnpm test:ui` (728);
each fault a test guards against shown failing (15). An agent's review found 6, all confirmed:
a span's warning shown on the span around it and not on itself (now on the piece and its line);
two identical warnings sharing a list key (now keyed by place); nothing keeping the rules out of
the editor's file (now ESLint); no quick tests of where warnings show (now four); a figure and a
comment off; a tall block's top scrolled off the screen (now under the bar and its toolbar) and
an untyped hand-over of the results (now typed). Logged, not fixed: if the rules' file can't
load (measured), the editor works without warnings, and the page builder is told "Something went
wrong", and, with the other session's new-version work, "This page couldn't load. Refresh to try
again.": that handler takes every file that won't load for a page. A refresh is the retry.

**Step 7** (2026-11-11). The cursor across the code view (`codeViewCursor.ts`): each way a marker
goes where the cursor is and the page converts as it always does, and the cursor's line stays at
its height on the screen. Settled with the owner: one rule, no code for each kind of place; a
selected block going in as its whole code and back as the block; parse5 (8.1.1, its own file,
loaded as the code view opens) for where tags are, over a count of our own or Prettier's reader;
the marker's two forms coming back. Measured in Chrome: it was line 1 going in, and the end of the
page coming back after an edit; now 400 of 400 text cursors and selections come back exact, the
code always the code view's own; all 532 of the test page's blocks go in as their whole code and
522 come back as the block (10 table rows and cells, which the page makes cell selections, go as
the text nearest them); every one of the 26,427 places in its code lands on the page; going in
about 45 ms the first time, coming back about 5 ms more; the editor's own file 1.7 KB larger, and
parse5's 43.9 KB gzipped. Checked: `pnpm test`, `pnpm typecheck --all`, ESLint, Prettier,
`pnpm test:ui` (776); each fault a check guards against shown failing (16). An agent's review
found 6, all confirmed and all this step's: a private-use character in the page (an icon font's)
taken for a marker (now characters the code doesn't hold); a run of text selected exactly taken
for a block; select-all handing over places outside the code; bold set for what's typed next
dropped by setting an unchanged selection again; a comment marker splitting text, so TipTap's
reader dropped a line break left on its own (the end of a code block's last line; now a character
in text); the look-back rule missing a closing tag after the cursor on its line (`</td>` at a
line's start). Also fixed: parse5 not tried again after a failed load. On the review's richer page
after: 409 of 409 places there and back, and the 39 left in place all in character codes
(`&amp;`), as planned. Logged in the to-do: bold lost in a component block's text after the code
view (`useNodeViewInteractions.ts`, the same before this step, measured on the old code); a second
parse5, from the tests' `hast-util-from-html`.

Next: every step is done. What lasts goes where it belongs, and the plan is deleted, with the
owner.
