# Plan: contrast on white

On the light theme the brand colour, amber, and the edges of buttons are too faint to see against
white (WCAG 1.4.11 asks 3:1 for a line or mark, 1.4.3 asks 4.5:1 for words). Agreed with the owner
on 2026-11-24 from a mock-up measured live in both themes (`client/src/assets/sf-system-todo.md`,
"Theme and classes"). This plan is the first step only: the theme's colours, the 30% edge, and
the inks for lines and words. Everything else waits, one at a time (below). Deleted when done, as
every plan is.

## What an author sees

| Where                                        | Today (light)                  | After (light)                                   |
| -------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| Brand colour                                 | green                          | soft lilac (dark theme too)                     |
| A picked block's line (solid)                | green 2.5, amber 2.1, red 3.76 | brand, crimson and amber inks, all over 3:1     |
| A field's or code box's focus edge           | green, 2.5:1                   | the brand ink, 3.44:1                           |
| A button's or chip's edge                    | 1.07:1                         | the text colour at 30%, 1.86:1 (looks, not 3:1) |
| Brand-coloured words (links, the logo, menu) | green words, 2.5:1             | deep violet, 5.55:1 (dark: pale lilac, 12.65:1) |
| Words on a loud lilac, amber, green button   | white                          | dark                                            |
| Danger and info                              | red 239 68 68, blue 59 130 246 | crimson 200 16 58, blue 37 99 235 (both themes) |

Unchanged: the line's parts (solid picked, else half see-through; thick targeted; dashes for
errors and warnings; a half see-through line is a hint, not held to 3:1), keyboard focus, tinted
boxes, fields' and the code box's edges at rest,
dividers, cards and tables.

## Fill and ink

Each colour has a **fill**, which paints a surface and stays bright, and an **ink**, which draws
on the page. An ink reaches 3:1 on its theme's background. New tokens (names approved):
`--sf-primary_ink`, `--sf-danger_ink`, `--sf-warning_ink`, `--sf-success_ink`, `--sf-info_ink`.

**Where an ink equals its fill, the root theme points it at the fill**, so a theme that changes
the fill moves the ink with it. Where they differ (amber and green on white), a theme that changes
the fill sets the ink too, as it already sets `fg_on_*`. The root theme is always active, so a
`var(--x_ink, var(--x))` fallback would never fire; pointing is the only way an ink can follow
its fill. For the brand, a theme sets the scale (and `--sf-primary` / `--sf-primary_ink` if it
picks other steps); a theme that sets only `--sf-primary` keeps the lilac ink.

| Token                                        | Root (light)          | Dark                                 |
| -------------------------------------------- | --------------------- | ------------------------------------ |
| `--sf-primary`                               | `var(--sf-primary-4)` | as root (override removed)           |
| `--sf-primary_ink`                           | `var(--sf-primary-6)` | `var(--sf-primary)`                  |
| `--sf-danger`                                | 200 16 58             | as root                              |
| `--sf-danger_ink`                            | `var(--sf-danger)`    | 239 68 68                            |
| `--sf-warning`                               | 245 158 11            | as root                              |
| `--sf-warning_ink`                           | 214 110 0             | `var(--sf-warning)`                  |
| `--sf-success`                               | 34 197 94             | as root                              |
| `--sf-success_ink`                           | 8 160 72              | `var(--sf-success)`                  |
| `--sf-info`                                  | 37 99 235             | as root                              |
| `--sf-info_ink`                              | `var(--sf-info)`      | 59 130 246                           |
| `--sf-fg_on_primary`, `_warning`, `_success` | 38 40 36 (dark words) | as root (primary's override removed) |
| `--sf-fg_on_danger`, `_info`                 | 255 255 255           | as root                              |

Pointing works because the theme class sits on `<html>`, the same element as `:root`
(`client/index.html`, `darkModeStore.ts`), so `var()` resolves with the active theme's values, as
`--sf-primary: var(--sf-primary-5)` does today.

**The lilac scale.** The 9 steps keep the agreed fill (step 4) and ink (step 6) exactly; the others
share their hue (OKLCH 301°), evenly spaced in lightness either side of them. The light fill moves from step
5 to step 4, the dark theme's step, so both themes share it.

| Step  | 1           | 2           | 3           | 4 (fill)    | 5           | 6 (ink)     | 7          | 8          | 9         |
| ----- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ---------- | ---------- | --------- |
| RGB   | 242 234 255 | 230 215 255 | 217 191 255 | 200 165 255 | 178 143 232 | 156 122 208 | 130 97 177 | 105 77 145 | 84 60 117 |
| White | 1.17        | 1.35        | 1.63        | 2.04        | 2.63        | 3.44        | 4.89       | 6.84       | 9.21      |

## Which rules change

**Lines and marks read the ink** (the agreed list):

| Rule                                                                                | Reads today      | After       |
| ----------------------------------------------------------------------------------- | ---------------- | ----------- |
| The line's default colour (`drawsLine`)                                             | `--sf-primary`   | primary ink |
| `sf-is-error` / `sf-is-warning`: line colour, border                                | danger / warning | their inks  |
| `sf-on-focus` × `sf-is-error` / `sf-is-warning` border                              | danger / warning | their inks  |
| `sf-field:focus-visible`, `sf-on-focus` border                                      | primary          | primary ink |
| `sf-content-frame:focus-within` border                                              | primary          | primary ink |
| `sf-drag-handle` × hover / dragging: icon, dragging border                          | primary          | primary ink |
| `sf-thumb sf-on-current` (the switch's knob when on)                                | primary          | primary ink |
| `input.sf` accent-color (tick box, radio, range)                                    | primary          | primary ink |
| The colour tools' "no colour" stripe (`ColorPicker.vue`, `ToolbarColorControl.vue`) | danger           | danger ink  |

**Brand words** take the rule the other four colours' words already use: the colour mixed half
with the text colour, chroma doubled (`oklch(from color-mix(…) l calc(c * 2) h)`), as written
for danger today:

| Rule                                         | Today   | After       |
| -------------------------------------------- | ------- | ----------- |
| `sf-variant-primary`, `sf-variant-featured`  | primary | brand words |
| Links in running text                        | primary | brand words |
| `sf-on-current`, `sf-on-hover sf-on-current` | primary | brand words |

**The 30% edge:**

| Edge                                                             | Today                      | After                      |
| ---------------------------------------------------------------- | -------------------------- | -------------------------- |
| `button.sf`, `a.sf`, `summary.sf`; `button.sf-chip`, `a.sf-chip` | border colour at 40% / 30% | text colour at 30%         |
| `button.sf` / `a.sf` × `sf-loudness-2`                           | border colour at 50%       | rule removed: 30% as above |

A tinted ordinary button's edge was a touch stronger than a plain one's; now both are 30%, as in
the mock-up.

**Unchanged reads:** loud fills and their hover and press, tints and their borders, avatars, the
dragging handle's tint, the quote's stripe, quiet brand words (`sf-loudness-1`, `sf-on-ancestor`),
the map demo's location dot.

## Knock-ons

| What                                            | Today                                             | After                                                                                                                             |
| ----------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| The logo, the signed-in icon                    | green (`sf-variant-primary`)                      | brand words: deep violet in light, pale lilac in dark                                                                             |
| Quiet brand words                               | green at 60% / 70%                                | lilac at 60% / 70%: fainter on white than today (left for later, below)                                                           |
| Colour picker                                   | lists every colour token with a value             | also lists `warning_ink` and `success_ink`; brand, danger and info inks point at another colour, so (as today's rule) they aren't |
| Pink mode                                       | brand fill is its step 5                          | its step 4 (the root's alias moved); its ink is its step 6. Not redone, as agreed                                                 |
| The current item (`sf-on-current`)              | green tint and edge                               | violet tint and edge: both are drawn from its words' colour (edge 1.46 → 1.79)                                                    |
| Dark: danger and info tints, loud danger button | tint edges 2.93 / 2.97; loud red on the page 5.28 | 2.13 / 2.34; loud crimson 3.40, blue 3.84: the fills are the light theme's now, as agreed                                         |

**Accepted limits** (no code):

- The switch's knob is painted with the ink and its icon in `fg_on_primary`, which a theme picks
  for the fill. Fine in the root theme (4.33:1); a theme with a dark ink and a light fill sets
  them to match. Pink mode: 2.60:1, not redone.
- Dark: dark words on a loud amber or green button while it's pressed (the fill at 70% over the
  page) are 3.66 / 3.50:1, only while pressed.

**Raised in review, not taken:** working each ink out in the rules (the fill mixed 25% with the
text colour), which would follow any theme's fill with no tokens. The inks come out greyer than
the agreed ones (lilac's chroma 0.129 → 0.095) and the dark lines paler than the fill, and a theme
couldn't pick its own; the owner asked for the brand ink as a step of the scale.

## Building it

One step: build, `pnpm typecheck --all`, `pnpm test`, `pnpm test:ui`, seed version 2.95.0 and
`pnpm seed:local`, a look in Chrome in both themes (loud buttons and dark tints too), one review,
the owner's go-ahead, commit (the `ship-step` skill).

The spec: a "Fill and ink" section under "Tokens" with the reasons above; the token list; `fg_on_*`
and "A theme that changes a colour role sets its fg*on*\* to match" extended to inks; "Line parts"
(the colour is the ink; keyboard focus's reason); the `--sf-primary` = `--sf-primary-5` example in
"When a token belongs" and the `.theme-editorial` example in "Themes", which set a step that's no
longer the brand. In `seed.ts`, the comments that go untrue ("one value serves light and dark",
the dark brand fill's words).

Checks:

- A new check in `client/e2e/root-theme/` reads what the page draws, in light and with
  `theme-dark` on `<html>` (`helpers.ts`, `useTheme`, so the pointed tokens resolve as in the
  app), and measures each against the background really under it: 3:1 for a picked block's line
  (plain, with a warning in light, with an error in dark), a field's focus edge; 4.5:1 for a
  brand link and the words on a loud brand and a loud amber button.
- `warnings.spec.ts` compares the line with the inks.

## Text parts (this step)

Agreed with the owner on 2026-11-25 from a side-by-side built from the served stylesheet
(https://claude.ai/artifact/9y1RH89nQECdaAPSm2BS1X; owner: "looks good"). Names approved.

### What an author sees

| Where                                                                   | Today (light)                                                                 | After (light)                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Coloured words under the pointer (3 warnings, a node-path warning, ⚙)  | plain words, grey tint (12.25:1); red keeps its own                           | the colour at full strength, its own tint (4.84:1)              |
| Pressing a coloured button                                              | grey tint                                                                     | a tint in its colour, as on hover                               |
| Portfolio (`sf-on-ancestor`) under the pointer, header and phone menu   | plain words                                                                   | violet words, violet tint (4.42:1, accepted below)              |
| Quiet brand words (`sf-loudness-1 sf-variant-primary`; none in the app) | the lilac fill at 60%, 1.51:1                                                 | the brand words at 60%, 2.52:1                                  |
| A picked loud button (none in the app)                                  | violet words on lilac 2.72:1; on red 1.52:1                                   | its fill's words, 7.28:1 / 5.85:1                               |
| A loud or tinted button that is on (`sf-on-current`; none in the app)   | a pale tint of its words replaces the fill; loud red under the pointer 1.83:1 | keeps its fill and its words; loud red under the pointer 4.87:1 |

Unchanged: plain and loud buttons at rest and under the pointer, red under the pointer, current
items, picked chips, tints, fills, the drag handle, links, `sf-on-ancestor` at rest.

**Accepted limit:** coloured words on a hover tint dip below 4.5:1 (Portfolio 4.42:1; the node
path's current block already goes 4.84 → 4.19:1 today). One fix for every tint, later (below).

### The parts

Two parts, registered as not inherited, as the line's and the fill's are (`css/reset.ts`):

- `--sfx-text-color`: what an element's words are. Each colour passes its words
  (`sf-variant-*`), each fill its `fg_on_*` (loud colours, plain loud buttons, chips, tags,
  statuses, counters, avatars, the switch's knob). A `words()` helper beside `fill()` passes the
  part and draws `color` from it, so a fill's words always come with it.
- `--sfx-text-alpha`: how strong. Quiet passes 60%; hover passes 1, "full
  strength", instead of resetting the words.

Readers:

| Rule                                             | Today                                     | After                                                                                     |
| ------------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `sf-loudness-1`                                  | `currentColor` at 60%                     | `currentColor` at `--sfx-text-alpha`                                                      |
| `sf-icon` × `sf-loudness-1`                      | `currentColor` at 40%                     | passes 40% as its strength, so hover lifts it; a coloured quiet icon is 40% too (was 60%) |
| `sf-variant-*`                                   | its words                                 | its part at `var(--sfx-text-alpha, 1)`                                                    |
| `sf-loudness-1` × `sf-variant-*` (6)             | the words at 60% (brand: the fill at 60%) | removed: the bare variant reads quiet's strength                                          |
| `sf-on-hover`                                    | `color: inherit`                          | `--sfx-text-alpha: 1`; no colour                                                          |
| Hover × danger (1)                               | undo hover's reset                        | removed                                                                                   |
| Hover × loud (7)                                 | undo hover's reset, per colour            | one rule: `var(--sfx-text-color, <light words>)`                                          |
| `sf-on-selected` (10 with hover)                 | brand words; a colour keeps its own       | one rule: `var(--sfx-text-color, <brand words>)`                                          |
| `sf-on-current` (10 with hover)                  | the same, as compounds                    | two rules, at rest and with hover, as picked's                                            |
| `sf-on-current`'s tint (3: rest, hover, pressed) | a tint of its words                       | `var(--sfx-fill-color, <the tint>)`: a fill stays                                         |

32 colour rules go and 1 is added. `sf-on-ancestor`, links and the drag handle don't read the parts.

Hover × loud stays a rule because the theme paints a loud thing dark under the pointer, so its
words must turn light even when the thing has no fill of its own: a loud link an author writes
with no colour (none in the app). Without the rule it goes dark on dark, 1.61:1 under the pointer
and 2.65:1 pressed; with it, as today, 9.23:1 and 5.61:1. Shown to the owner on 2026-11-25
(https://claude.ai/artifact/EgDsHAtGQawpo22SbCaUxF).

Being on never takes a fill away, as a context never does. Current's tint is drawn from its words,
and a loud fill's words are light, so as first written a loud button that is on became light words
on a light tint (1.00:1). Now a filled button that is on keeps its fill and its words. Agreed with
the owner on 2026-11-26 (https://claude.ai/artifact/JCSU14xPdGZSKTVcDcs4uw). **Accepted limit:** a
plain loud button that is on doesn't darken under the pointer (its words stay 14.88:1); the owner:
pressing it may turn it off, but "I'm willing to accept this". A filled button that is on looks
nearly as it does off (only its edge changes); a different look for on can come later.

Current keeps a colour in its hover rule, after hover × loud in the same layer, so a loud link
that is on and has no fill keeps the brand words on the brand tint under the pointer and pressed,
as today. Without it hover × loud wins and the link's words go light on a light tint, about 1:1
(the plan's review, 2026-11-26; none in the app).

Edge cases, no code: a tinted brand button (`sf-loudness-2 sf-variant-primary`) keeps plain
words with `color: inherit`; picked or current it takes the brand words, as today. The part isn't
inherited, so a picked plain chip inside a red box takes the brand words, as today.

### Building it

Build, `pnpm typecheck --all`, `pnpm test`, `pnpm test:ui`, seed version 2.99.0 and
`pnpm seed:local`, a look in Chrome (the editor's top bar, node path and ⚙ with a warning; the
header and phone menu on `/c/branding`; light and dark), one review, the owner's go-ahead, commit.

Checks, in `client/e2e/root-theme/contrast.spec.ts`. The spec's cases measure words at rest, so
a case can now put the pointer on its element (and press) first, with a real pointer. What's
behind the words is every background from the page up to the element, laid one over the other,
since a loud fill under the pointer or pressed is see-through (85%, 70%); today's measure takes
the first solid one and would measure light words against the page.

- Words 4.5:1: a picked loud button (fails today); a loud red button that is on, and a loud link
  with no colour under the pointer and pressed (both pass today; they guard the fixes above).
- Keeps its colour: an amber button's words are the same colour under the pointer as at rest
  (fails today). A readability check can't see this: amber passes 4.5:1 before and after.

No check for quiet brand words: at 2.52:1 they stay short of 4.5:1, a limit already listed below.

The spec: "Custom property conventions" gains a Text part row; a "Text parts" section after
"Fill parts" with the reasons (hover's reset was why the compounds existed; a theme sets the part,
never `color`, as with fills); "Line parts" (picked's words: the element's own, else the brand's);
"Quiet is a shade…" (quiet passes its strength, hover full strength); "Fill and ink" (quiet brand
words). `seed.ts` comments that go untrue. The to-do's "Open" entry loses text parts and gains the
hover tint limit.

## Later, one at a time

Each goes back to the to-do when this step lands:

- Coloured words on a hover tint dip below 4.5:1 (Portfolio under the pointer 4.42:1, the node
  path's current block 4.19:1).
- A picked danger chip among plain ones is hard to tell from the others: whether picked's line
  should take the chip's colour (owner disagrees with keeping it lilac; to look at).
- The quote's stripe in the ink.
- Quiet brand words (`sf-loudness-1`) short of 4.5:1.
- The drag handle's icon, 2.36:1.

## Progress

- 2026-11-24: brand words take the other colours' rule (owner).

- 2026-11-24: plan reviewed (one agent). Taken into the plan: the colour tools' stripe, the
  knock-ons (current item, dark tints), the token rule for themes and its spec examples, the dark
  `fg_on_primary` override, the line row's numbers, the checks. Two accepted limits, one
  alternative not taken (above). Open with the owner: inks nothing draws with yet; the warning
  ink in the colour tools; a loud button's 30% edge.

- 2026-11-24: owner: all five inks stay (a builder's common case); the eight ink colour classes
  approved; a loud button or chip keeps its faint light edge (the mock-up's "loud and quiet keep
  theirs"). Built. Checked: typecheck, `pnpm test`, `pnpm test:ui` (1168 passed; 4 fail with the
  old theme too: `componentBlock.spec.ts` "a drag from the text above…" in Chrome,
  `anchorFallback.spec.ts` "a panel on a short screen…" in WebKit); the new contrast check fails
  on the old theme (line 2.54:1, white on amber 2.15:1) and passes now; a look in Chrome, light
  and dark.

- 2026-11-24: committed without a review (owner): one review of the whole when the items below
  are done.

- 2026-11-24: fields' and the code box's edges at rest: the text colour at 60% (v2.96.0). Checked:
  typecheck, `pnpm test`, `pnpm test:ui` (1168 passed; the same 4 fail as above); the contrast
  check's new edge cases fail on the old grey (1.27:1 light, 2.24:1 dark) and pass now; a look in
  Chrome, light and dark. The owner approved the look; no review (one of the whole, as above).

- 2026-11-24: the menu's parent item (`sf-on-ancestor`, "Portfolio" on `/c/branding`), raised by
  the owner: it was the brand at 70%, 1.53:1 on the light header (green was 1.83). It now takes
  the brand words, no tinted box (light 5.05, dark 9.71 on the header); the owner chose it from
  Chrome with plain, parent and current side by side, in the header's menu and the phone menu
  (v2.97.0). Checked: typecheck, `pnpm test`, `pnpm test:ui` (1168 passed; the same 4 fail); the
  contrast check's new case fails on the old colour (1.63:1 light) and passes now; a look in
  Chrome, light and dark, desktop and phone. No review (one of the whole).

- 2026-11-25: the line and edges, decided with the owner from a side-by-side mock-up built from
  the served stylesheet (https://claude.ai/artifact/UbuiiV334K833jNCxDAMAF; owner: "this is the
  one"). Tried and dropped: an edge going clear for a line (it hid authors' borders on selected
  blocks; under dashes the edge reads as a thinner, lighter line, which the owner likes), the line
  standing 2px out on everything (a picked chip's line pressed on its neighbour 4px away), and
  rings for selection (rings for picked, targeted and tabbed clashed). Decided: the line lies over
  the 1px edge, and only a swatch keeps a gap, 2px; a state never changes an edge, so an error or
  warning shows with its line only; fields have no rules of their own, and `sf-on-focus` loses its
  lilac edge; an error or warning is full strength unless targeted; targeted is wide and faint in
  the line's colour (lilac when nothing else colours it); keyboard focus's ring goes just outside
  the line, which no longer steps out; picked words built the long way (ten compounds, as
  `sf-on-current` has), so the owner sees them live, until text parts replace both. Known gap: in
  forced colours a focused element with a line shows no focus (the ring is a shadow; the line used
  to step out). Checked: typecheck, `pnpm test`, `pnpm test:ui`; the changed checks fail on the
  previous build first (the line's offset; the focus look). Committed and pushed at the owner's
  word, to review on the live site (v2.98.0).
  Text parts (next): a reviewer proposed each colour and loud fill passing its word colour
  (`--sfx-text-color`) and strength (`--sfx-text-alpha`), read by picked, current and hover, with
  hover saying "full strength" instead of resetting the words (its `color: inherit`, added in June
  to undo quiet words, is why 13 hover compounds exist): one rule for picked and 22 removed.
  Proved in Chrome: the fallbacks and `oklch(from …)` work. Visible changes for the owner to
  agree: hovered coloured words keep their colour; quiet brand words become the brand's words at
  60%. Names need approval.

- 2026-11-25: the owner looked on live ("looks good"); one review of the whole (one agent), 7
  findings, each shown in Chrome or by a check first. Fixed (v2.98.1): a picked swatch went faint
  under the pointer (one rule keeps it full); keyboard focus's ring showed through a dashed or
  faint line's gaps and filled a swatch's gap (under the line the shadow takes the surface the
  element sits on: owner chose it from a side-by-side; on a fill that isn't a surface, 1px of the
  surface shows, accepted); a picked swatch's line met its neighbour 4px away (a swatch that can
  be pressed keeps a 2px margin all round, owner; a colour inside a button has none); this plan
  contradicting itself; old words on fields' focus rules; a check that passed without picked.
  Logged: a picked loud button's words are unreadable (none in the app), for text parts. Checked:
  typecheck, `pnpm test`, `pnpm test:ui`; each new check fails without its fix.

- 2026-11-25: text parts agreed from a mock-up (above): hovered colours keep their colour, quiet
  brand words become the brand words at 60%, a picked loud button keeps its fill's words; the
  hover tint's 4.42:1 accepted for now; names approved.
- 2026-11-26: the plan's review found two looks it would break, both agreed fixed from mock-ups:
  loud words stay light under the pointer, and being on keeps a fill. The checks now put a real
  pointer on an element and test an amber button keeping its colour.
- 2026-11-26: text parts built (v2.99.0). Found while building: the quiet icon set its own colour,
  which only hover's reset lifted, so it passes its strength instead. Checked against the agreed
  mock-up in 2,268 combinations, light and dark: the same but for that icon and a quiet coloured
  avatar (its words at 60% on its fill; none in the app). The new checks fail on v2.98.2 (picked
  loud brand button 2.72:1 light, 1.30:1 dark; amber under the pointer turned plain).

Next: the forced-colours focus gap, then the picked danger chip's line.
