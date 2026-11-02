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
| The page reader          | the page's blocks | elements, each with its block's place and style |
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
   read it.
4. **The other rules for a page:** a picture with no size of its own (the sizes that count are
   in "A picture's space before it loads"), `sf-heading-*` on a block that isn't a heading or
   twice on one, and the gentle ones: `sl-center` on a video, and a long run of side-by-side
   blocks that each hide or show (how long is settled in the step). Then the rules that read CSS
   and can break in a block's own style: `no-container-units`, `require-channel-fallback`,
   `no-width-container`, `no-overflow-hidden` and `no-content-sized-box` (what sizes by content,
   a flex row or `fit-content`, is settled in the step). A theme's rules and a component's styles
   will run them too, so they read CSS, not the editor's style; how a block's style is read is
   settled in the step.
5. **The page reader.** The page's blocks as elements, each with its position, walking the page
   (ProseMirror's `descendants`). The page is the content tree the rules are written for, so
   there are no content boxes to step through: those are only on screen. A component block's
   element carries its component's own `sl-` classes (the Centre's `sl-center sl-stack`: its
   arrangement, and the centred column the bleed rule reads), which the component states once.
   Today only each component's root says them (`sl-stack` in `LayoutStack.vue`), and the list of
   components (`editorComponents.ts`) doesn't; how is settled in the step.
6. **The block view's display.** Designed with the owner first, from what the editor has (the
   node path, the class row, the Save button, toasts): where a warning shows, when the rules run
   (as the page changes, or on save), and the class row flagging a rule as the classes are typed
   (the spec's "Validator and linter"). Joins the page reader and the core.
7. **The cursor across the code view.** Found while planning; not part of the validator. Today
   the code view opens on line 1 wherever the cursor was, and leaving it after any edit puts the
   cursor at the very end of the page (measured). One marker character carries the cursor
   through the page's own conversions. Going in, it's put in a copy of the page at the cursor,
   the page writes the copy as code (`codeViewHtml`, then Prettier, which never wraps by width
   here, so the character moves nothing else), and the code view's cursor goes where it is.
   Coming out, it's put in the code at the cursor, the page reads the code its own way, and the
   page's cursor goes where it lands. Tried on the test page in Chrome (2026-11-01): 400 of 400
   places came back exact both ways, and the code written was the code view's own. The cases are
   settled with the owner first: a cursor in a tag, between blocks, on a selected block (a
   picture), a selection, leaving without an edit (the page keeps its old cursor today), and
   code the page can't read.

### Decisions

Owner, 2026-11-01:

- **The editor's blocks only.** Later, in the to-do: the IDE linter ("Bigger work"), for
  developers writing pages and components in files, which also carries the CSS rules on a
  component's styles and the component's code rules, and which the component store runs when a
  component is added; the check when a theme is saved, once there's a theme editor; and
  underlines in the code view ("Ideas, not decided"), since the warnings show on the blocks once
  you leave it.
- **Not built:** checking the page as drawn (the IDE linter covers code in files), and a check on
  the server when a page is saved (warnings are for the person editing).
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

Next: step 2, the core.
