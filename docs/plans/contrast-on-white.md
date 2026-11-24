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

## Later, one at a time

Each goes back to the to-do when this step lands:

- Fields' and the code box's edges at rest: the text colour at 60% (agreed).
- An edge steps aside for a line, so a selected chip or swatch shows one line (agreed; needs a new
  line part, its name for approval).
- An error's or warning's border on fields only; every other box shows it with its line.
- The quote's stripe in the ink.
- Quiet brand words (`sf-loudness-1`, `sf-on-ancestor`) short of 4.5:1.
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

Next: the first of "Later, one at a time" (fields' and the code box's edges at 60%), in its own
session.
