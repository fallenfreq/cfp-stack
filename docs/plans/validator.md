# Plan: the validator, for page builders

The rules the system relies on that nothing checks yet are in `client/src/assets/sf-system.md`,
"Validator and linter", each with its reason in the section it names. This plan builds the part
for page builders: warnings on the blocks in the editor. Each step is a session of its own.
Deleted when done, as every plan is.

## The shape

Agreed with the owner, 2026-11-01. Three pieces, each with one job, built and checked alone, then
joined:

| Piece                    | Takes             | Gives                                 |
| ------------------------ | ----------------- | ------------------------------------- |
| The core                 | elements          | results                               |
| The page reader          | the page's blocks | elements, each with its block's place |
| The block view's display | results           | marks on the blocks                   |

- **An element** is what the rules read: its tag, classes, id, attributes and children, and its
  place, which the core hands back untouched.
- **A result** is one rule broken: the rule's name, its kind (a warning or a gentle one, ESLint's
  "problem" and "suggestion"), its message in plain terms, the places of the elements involved,
  and the spec section that gives the reason. Every display takes the same results.
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
   rule, two elements with one id, which needs no list. It reads nothing of the editor's, so the
   IDE linter can use it later; where it lives (the client, or `shared/`) is settled in the step.
   Checked by unit tests run by `pnpm test` (`node --test`, as the API's are), elements in and
   results out.
3. **The layout rules:** one layout per box, a centred column that bleeds, and a collapsing
   layout straight in a side of a split. They read the fixed CSS's lists of layouts and classes
   (`GAP_LAYOUTS`, `COLLAPSE_CLASS_SELECTOR`, `slLayout.ts`), not a copy. Those are the API's
   today, so what they're made from moves to `shared/`, as the slug rule did, and both read it.
4. **The other element rules:** a picture with no size of its own (the sizes that count are in
   "A picture's space before it loads"), `sf-heading-*` on a block that isn't a heading or twice
   on one, and the gentle ones: `sl-center` on a video, and a long run of side-by-side blocks that
   each hide or show (how long is settled in the step).
5. **The page reader.** The page's blocks as elements, each with its position, walking the page
   (ProseMirror's `descendants`). The page is the content tree the rules are written for, so
   there are no content boxes to step through: those are only on screen. A component block's
   element carries its component's own layout, which the component states once. Today only each
   component's root says it (`sl-stack` in `LayoutStack.vue`), and the list of components
   (`editorComponents.ts`) doesn't; how is settled in the step.
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
  developers writing pages and components in files, which also carries the CSS rules and the
  component's code rules, and which the component store runs when a component is added; the
  check when a theme is saved, once there's a theme editor; and underlines in the code view
  ("Ideas, not decided"), since the warnings show on the blocks once you leave it.
- **Not built:** checking the page as drawn (the IDE linter covers code in files), and a check on
  the server when a page is saved (warnings are for the person editing).
- **ESLint's shape, not ESLint.** ESLint reads only text, so the blocks would go through code and
  back, and the editor would carry ESLint. The IDE linter will be a thin ESLint plugin: each of
  its rules calls the core, ESLint's Vue and HTML parsers read the code, and ESLint shows the
  results and holds the settings.
- **Not written twice:** a rule's reason (the spec section it names), the lists of layouts and
  classes (the fixed CSS's), and ids on copies (the editor already takes the id off a copy it
  makes; the rule is for ids the author typed).

Checked while planning: no HTML linter fits as the core. html-validate, which runs in a browser,
also reads only text (`validateString`, `validateSource`).

## Progress

Nothing yet.

Next: step 1, the spec's rules sorted by what they read.
