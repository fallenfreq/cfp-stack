# The sf/sl Design System

A small vocabulary of CSS classes stored on content nodes. The active theme interprets
them, so the same content renders differently under different themes without migration.

```json
{ "class": ["sl-columns", "sf-depth-1", "sf-variant-featured", "sf-gap-lg"] }
```

Two prefixes:

- **`sf-`** for appearance and meaning — surfaces, variants, states, properties.
- **`sl-`** for arrangement — stacks, clusters, grids, splits.

## Three actors

Three actors share the vocabulary; each can work without knowing the others.

**Theme author** decides how `sf-` classes are expressed visually and how shared scales
resolve. Sets scale tokens, and overrides class definitions when the look needs different
CSS properties — not just different values. Themes set looks, never arrangement: a theme
may use `sl-` classes to find things (a pinned edge, a scroll area) and places its own
`::before`/`::after` decorations, but never moves, sizes the flow of, or aligns elements.

**Component author** bakes classes into a component's structure. A `Card` might already
wear `sf-depth-1`; a `Dialog`, `sf-depth-3`. These decisions live in code.

**Content author** writes the content. Mostly that's text and images; beyond that they
can wrap content in a pre-built component (whose classes are baked in) or wrap it in a
plain node and apply classes themselves through the editor UI. Their decisions serialise
as classes on `node.attrs.class` and travel with the content.

A component authored before a particular theme existed will render **consistently** under
it, not necessarily well — a theme pushing `--sf-spacing-xl` to a huge value will break
any component using `sf-padding-xl` in a tight space. The system enforces consistency of
interpretation; sensible scale choices remain convention.

---

## Vocabulary governance

The vocabulary must remain small and stable. Growth is the primary failure mode.

**The test:** does the meaning survive theme changes?

| Class                  | Belongs? | Why                                                                    |
| ---------------------- | -------- | ---------------------------------------------------------------------- |
| `sf-variant-danger`    | Yes      | Danger is intent                                                       |
| `sf-on-hover`          | Yes      | Hover is a state                                                       |
| `sf-depth-1`           | Yes      | Visual layer position coordinates perceived hierarchy                  |
| `sf-variant-subtle`    | No       | Redundant — loudness covers attention weight                           |
| `sl-columns`           | Yes      | Columns is structure                                                   |
| `sf-fg_primary`        | Yes      | Shared semantic value                                                  |
| `sf-loudness-1`        | Yes      | Attention hierarchy is intent, not a visual treatment                  |
| `sf-is-overflow-right` | Yes      | Runtime condition set by JS, not authored intent                       |
| `sf-is-edge-top`       | Yes      | Viewport-flush context — theme decides corner treatment                |
| `sf-boundary-top`      | Yes      | Boundary signals edge-treatment intent, not a CSS property             |
| `sf-divide-y`          | Yes      | Divide signals separation between children                             |
| `sf-variant-alt-1`     | Yes      | "Look distinct from the default" is portable intent; theme decides how |
| `sf-variant-glass`     | No       | Glass is a visual treatment, not intent                                |
| `sf-variant-card`      | No       | Card is an implementation concept                                      |
| `sl-sidebar`           | No       | Sidebar names content, not structure                                   |

If understanding the class requires knowing what the theme looks like or what the
content is, it does not belong.

A further constraint: HTML element selectors are a valid and intended theming surface.
Where the element type already encodes both semantic role and styling surface —
`<button>`, `<table>`, `<input>` — the theme targets the element directly. Element
types AND-chain with sf classes exactly as classes AND-chain with each other —
`button.sf-variant-danger` is a button carrying danger intent, the same pattern as
`.sf-depth-1.sf-variant-featured`. All go in `sf-bundle`; element selectors (0-0-1)
lose to class selectors (0-1-0) in the same layer, so bare element rules naturally
sit below class bundles. With classes present, the layer follows the highest-kind
class as normal.

The sf vocabulary fills the gap where element type alone is insufficient:
`sf-heading-*` exists because h1–h6 encode document outline position, not visual
prominence, and the two can diverge. `sf-variant-danger` exists because a `<button>`
alone does not encode destructive intent.

The classes shown here are the current vocabulary; new bundle families, variants, and
states join through the same admission test.

**Second-level test for bundle families:** does the semantic role and the visual
treatment ever need to diverge? `sf-heading-*` exists because they do — a nested h1
may need heading-2 treatment. Body text has no such split; a `<p>` is prose, and its
visual weight is a utility question (`sf-text-lg` for a lead paragraph), not a bundle.
Add a bundle family only when the divergence is real.

Slot labels come in three kinds. **Named** (`xs/sm/md/lg`, `tight/normal/wide`) encode
intrinsic magnitudes — themes scale values; ordering is locked by the name's physical
meaning. **Numbered, semantically positioned** (`depth-0..3`, `heading-1..3`, `loudness-1..3`)
encode an external concept (z-stack position, document hierarchy, attention hierarchy);
the ordering is meaningful by what it maps to. **Numbered, arbitrary** (`primary-1..N`,
`alpha-1..N`, `weight-1..N`) are pure slot positions — the theme decides values; adjacent
slots imply no ordering.

The rule for new numbered scales: if the direction comes from outside the system (HTML
convention, z-stack intuition), number it and let the external ordering carry the
meaning. If the direction is native to the concept, name it — a name makes the direction
explicit and doesn't invite the "why does 5 mean more than 3" question. Existing scales
(loudness) predate this principle and stay numbered; the cost of renaming stored
content outweighs the nomenclature purity.

---

## Cascade layers

CSS cascade layers fix the override order regardless of source order:

```css
@layer reset, ui, sf-element, sf-bundle, sf-variant, sf-context, sf-semantic, sf-utility, sf-state, sl-layout;
```

Layers are declared lowest to highest priority; inline styles override all of them.

| Layer         | Holds                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| `reset`       | Fixed starting point: browser differences evened out, element defaults cleared — lowest      |
| `ui`          | Component `<style>` blocks — below every system class                                        |
| `sf-element`  | Bare element rules (`code.sf`, `table.sf`) and element markers (`sf-chip`)                   |
| `sf-bundle`   | Multi-property bundles (depth, heading, loudness, size, boundary, divide, etc.)              |
| `sf-variant`  | `sf-variant-*` — override selected bundle properties to express intent                       |
| `sf-context`  | `sf-is-*` — JS-detected or author-declared runtime conditions (overflow, sticky, edge, etc.) |
| `sf-semantic` | Single-property semantic token bindings, auto-derived from tokens (e.g. `sf-fg_primary`)     |
| `sf-utility`  | Single-property bindings to a scale step (e.g. `sf-text-xl`), plus editor palette pairings   |
| `sf-state`    | `sf-on-*` — interaction modifiers (highest so hover/focus win over utilities)                |
| `sl-layout`   | `sl-*` — layout behaviour (declared last, so it wins where it sets a property)               |

Bundles are the authoring baseline. Single-property classes (semantic, utility) are
per-property overrides — they outrank variant because explicit property intent beats
bundle-level meaning. A variant modifies only the properties it touches; every other
bundle property survives.

`sf-utility` holds two sublayers: scale utilities (`sf-text-xl`) and editor palette +
alpha pairings (`sf-bg-primary-5` + `sf-bg-alpha-3`). Both emit as `@layer sf-utility`
blocks and share cascade order.

`sl-` layout classes govern arrangement. Mostly they set properties no `sf-` class
touches; where they do overlap, layout wins by design — `sl-inset` and `sl-inset-line`
replace a chrome box's side padding with the inset margin, keeping its top and bottom
padding.

### Ties within a layer

When two classes on one element set the same property in the same layer, with equal
specificity, **a modifier beats the thing it modifies**, whatever the class names:
`sl-split sl-align-y-end` aligns to the end, and `sf-size-xs` sets the padding of an
`sf-depth-1` card. For `sf-` classes, each class carries an order number (default 0)
that settles these ties; modifiers such as `sf-size-*` carry a higher one. The number
only breaks ties — it never crosses layers and never beats a more specific combination
of classes. It belongs to the vocabulary, so themes can't change it. `sl-` classes are
fixed CSS, where modifiers (`sl-align-*`, `sl-inset-line`) are simply written after the
layouts they modify.

Themes restyle classes; they don't outrank combinations. A theme's rule for a class
beats the root rule for the same class, and the nearest theme wins when themes nest.
A theme rule doesn't beat a more specific root combination
(`.sf-depth-1.sf-loudness-3`). A theme that restyles a layout's own alignment would
also beat the alignment modifiers, so alignment is not a theme's to change — themes
change looks, not arrangement.

All class definitions — defaults and theme overrides alike — must live inside their
matching `@layer` block. **Unlayered CSS beats all layered CSS** regardless of
specificity, so an override written outside a layer would silently destroy the order.
Token declarations (`.theme-x { --sf-X: ... }`) are exempt — custom properties cascade
per-property by specificity and don't need to live in a layer.

---

## Custom property conventions

Six kinds of CSS custom properties appear across the system. They look alike but play
different roles. The prefix rule:

> `--sf-*` — a value an author could reasonably write inline.
> `--sfx-*` — only rules write this; internal rule-to-rule contract.

| Kind             | Example                                       | Set by                                                     | Read by                          |
| ---------------- | --------------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| Theme token      | `--sf-primary-5`, `--sf-fg_primary`           | Theme class (`.theme-x { --sf-X: ... }`)                   | Rules across every layer         |
| Composition slot | `--sf-bg-alpha`, `--sf-shadow-color`          | Utility class (with reset); a page's own style beats it    | Carrier class in the same family |
| Layout channel   | `--sf-gap`, `--sf-padding`                    | `sf-gap-*` / `sf-padding-*` / `sf-size-*`; never inherited | The element that wears the class |
| Bridge           | `--sfx-surface-color`, `--sfx-inset-margin`   | Bundle rule (or layout rule, for `--sfx-inset-margin`)     | Higher-layer rule / descendants  |
| Line part        | `--sfx-line-width`, `--sfx-line-color`        | The class whose meaning it carries; never inherited        | Each class that draws the line   |
| Fill part        | `--sfx-fill-color`, `--sfx-fill-border-color` | The class that gives a box its fill; never inherited       | Each surface and context         |
| Text part        | `--sfx-text-color`, `--sfx-text-alpha`        | A colour or a fill; quiet and hover; never inherited       | Picked, current, loud hover      |

### Theme tokens

The vocabulary a theme owns. Semantic (underscore: `--sf-fg_primary`) or scale (hyphen:
`--sf-primary-5`, `--sf-radius-2`). Full details in [Tokens](#tokens).

### Composition slots

Let two classes compose a single CSS property without inline style. The carrier class
declares the property with a slot; a sibling class fills the slot.

```css
@layer sf-utility {
	.sf-bg-primary-5 {
		--sf-bg-alpha: 1; /* reset */
		background-color: rgb(var(--sf-primary-5) / var(--sf-bg-alpha));
	}
	.sf-bg-alpha-3 {
		--sf-bg-alpha: var(--sf-alpha-3); /* fills slot */
	}
}
```

The reset on the carrier is required — otherwise removing the alpha class leaves
whichever alpha value last cascaded in.

Same-family pairs: `sf-bg-*` + `sf-bg-alpha-*`, `sf-color-*` + `sf-color-alpha-*`,
`sf-border-*` + `sf-border-alpha-*`, `sf-shadow-color-*` + `sf-shadow-alpha-*`.

The shadow family is a two-hop: `sf-shadow-<size>` reads `--sf-shadow-color`;
`sf-shadow-color-*` writes `--sf-shadow-color` as an expression that itself reads
`--sf-shadow-alpha`; `sf-shadow-alpha-*` fills that inner slot. Because `--sf-shadow-color`
is a composition slot (not a bridge), a page's own `style="--sf-shadow-color: ..."` beats
every layer.

### Layout channels

Cross the `sf-` / `sl-` subsystem boundary. `sf-gap-md` sets `--sf-gap`; `sl-stack` on the
same element reads it. Both channels are registered as not inherited (`@property … inherits:
false`, in the fixed reset, from the list in `shared/layouts.ts`, `CHANNELS`), so a spacing
class applies to the element that wears it and nothing inside takes it on: a stack inside a
stack keeps its own gap, and a button inside a spaced row keeps its own.

Every reader gives its own default — `gap: var(--sf-gap, var(--sf-spacing-md))` on the
layouts, `var(--sf-padding, var(--sf-spacing-2xs))` on the compact units — or none where an
unset value already means no spacing (`sl-center`'s side padding, `sl-stack`'s padding).
Chrome classes set `--sf-padding` on themselves and read it, so `sf-size-*` on the same element
changes it. `sl-stack` reads it as a default in the lowest layer, so padding the theme gives the
same box wins; a centred stack (`sl-center`) keeps to its side padding.

Channels look like tokens because they share the `--sf-*` prefix, but they are runtime
slots filled by classes, not theme values.

Component-internal layout (gap between icon and label inside a button, controls inside
a picker) uses the channel with a scale-step default: `gap: var(--sf-gap, var(--sf-spacing-xs))`.
`sf-gap-*` on that same element overrides it. The raw scale step alone
(`var(--sf-spacing-xs)`) is not the pattern — it closes off the override.

### Bridges

Rule-to-rule contract when a context/state/utility rule needs a value a bundle owns.
The bundle publishes it as `--sfx-*` alongside its main declaration; the higher-priority
layer reads it. Neither theme authors nor content authors touch these.

| Variable              | Set by                              | Read by                                   |
| --------------------- | ----------------------------------- | ----------------------------------------- |
| `--sfx-surface-color` | `sf-depth-*`                        | `sf-is-overlay`                           |
| `--sfx-depth-radius`  | `sf-depth-*`                        | `sf-is-edge-*` compounds                  |
| `--sfx-depth-shadow`  | `sf-depth-*`                        | `sf-is-overlay` × loudness × variant      |
| `--sfx-inset-margin`  | `sf-depth-*` + `sl-inset` compounds | `sl-inset`, `sl-inset-line` (descendants) |

Two authoring rules keep the surface honest:

- **Publishing** — when writing a bundle rule, publish any value a consumer might
  plausibly want to read as `--sfx-*` alongside the main declaration. Cheap to add
  up-front; awkward to add retroactively once themes have shipped without it.
- **Reading** — consumers reach for the bridge with a CSS-level fallback,
  `var(--sfx-X, safe-default)`. If a theme drops the property from the bundle (and
  therefore stops publishing the bridge), the consumer degrades to the fallback
  rather than picking up a stale value.

**Exception — `--sfx-inset-margin`.** It is the one bridge set by layout rules (the
`sf-depth-*` + `sl-inset` compounds) and read by descendants rather than the same element: a chrome box that is also an inset
publishes its padding as the margin for everything inside it, so nested insets and
`sl-inset-line` elements share its line. Unlike the layout channels it is deliberately
inherited — lining up with the nearest inset is the point. With
no inset above, readers fall back to the page margin.

The alternative — hardcoding the underlying token (`var(--sf-radius-2)`) or writing
per-bundle compound rules — couples the consumer to the current theme's choice and
breaks under any theme that expresses the bundle differently. (The inset compounds are
per-bundle only in naming which classes own padding; the value comes from the padding
contract, not a hard-coded token.)

### Line parts

The line round an element (an outline, so it moves nothing) says several things at once, each
with one part of it, so no combination hides another (owner, 2026-11-21):

| Part      | Says                                                               | Passed by                      |
| --------- | ------------------------------------------------------------------ | ------------------------------ |
| Colour    | the danger ink an error, warning ink a warning, else the brand ink | `sf-is-error`, `sf-is-warning` |
| Dashes    | dashed an error, dotted a warning, else solid                      | `sf-is-error`, `sf-is-warning` |
| Thickness | thick (`--sf-stroke-3`) targeted, else thin (`--sf-stroke-2`)      | `sf-on-targeted`               |
| Strength  | half see-through targeted, else full                               | `sf-on-targeted`               |
| Gap       | a gap (`--sf-stroke-2`) round a swatch, else none: over the edge   | `sf-swatch`                    |

Each class passes its part (`--sfx-line-color`, `--sfx-line-style`, `--sfx-line-width`,
`--sfx-line-alpha`, `--sfx-line-gap`), and each class that means something about the line also
draws it, from all the parts there, with the defaults above (`sf-on-selected` passes nothing: it
only draws, so a picked thing has a thin solid line; a colour swatch draws it faint while
hovered, a hint, and full again when it's the picked one). Every one draws the same line, so it
doesn't matter which rule wins, and no other combination needs its own rule. A swatch that can be
pressed keeps a margin as wide as its gap, all round, so set the smallest spacing apart its
picked line and focus ring stay off the next one; a colour shown inside a button has none, so it
doesn't grow the button (owner, 2026-11-25). The dashes repeat the colour on purpose, so a warning doesn't
rest on colour alone. Picked's words are the element's own, else the brand's, as current's
("Text parts").

Why (owner, 2026-11-25, chosen from a side-by-side mock-up of the served stylesheet): an error or
warning is full strength, so it reaches 3:1 wherever it is (half see-through it was 2.0–2.5:1).
Wide and faint is what says "targeted", in whatever colour the line has: a targeted block with an
error keeps its dashes and colour, and picked is told apart by its thin solid line and its words.
The line lies over the element's 1px edge (just inside its box where it has none), so a picked
chip shows one line and its neighbours 4px away stay clear. The edge isn't changed: under dashes
or a faint line it shows as a thinner, lighter line, which reads fine, and a Card's, a divider's
or an author's border is never hidden. A swatch alone keeps a gap, so the line doesn't meet its
colour. The line is an outline, not a thicker coloured border, because a border is part of the
box's size: thickening it would move the page, and most blocks have none to colour.

The parts are registered as not inherited (`@property`, in the fixed reset), like the layout
channels: a targeted box doesn't thicken the lines inside it.

**Nothing changes an edge for a state.** An error or warning shows with the line only, on fields
too; it used to colour the element's edge as well, which showed two lines (owner, 2026-11-25).
Fields have no rules of their own here: they show errors and warnings as everything else does,
and focus too, but while typed into (below), so a theme has one way to draw each state.

**Keyboard focus** is a 2px ring in the text colour (owner, 2026-11-21; then, the brand colour fell
short of 3:1 on white, and the text colour reads on any theme's page). With no line it is the
element default outline. A line would replace that, so each class that draws the line also draws
the ring with focus, as a shadow reaching just past the line (owner, 2026-11-25): the line stays
where it is, and focus and every part of the line show together. A shadow can't leave a hole, so
under the line it takes the colour of the surface the element sits on (`--sfx-surface-color`):
a dashed or faint line's gaps look as they do unfocused. On a fill that isn't a surface (a loud
button, a hover tint), or round an element that is itself one, the gaps show that surface instead:
1px, an accepted limit. The element's own shadow gives
way while it's focused. Focus on an element whose only line is an error or warning is drawn in
the context layer, so a higher-ranked shadow there (an `sf-shadow-*` utility, `sf-is-overlay`
compounds) shows instead of the ring. A dropdown is no different: with focus alone it shows the
outline, with an error the dashed line and the ring outside it. A field typed into shows its
cursor instead (below). In
forced colours (Windows high contrast) shadows aren't drawn, so focus on an element with a line
doesn't show (it used to show as the line stepping out); open in the to-do.

The ring's strength is a part, `--sfx-ring-alpha` (full when unset), which both rings read: the
element default outline and the shadow past a line. A look that shows focus another way sets it to
0, never `outline`, which is also an error's line. Strength, not width: forced colours draws a
see-through outline in its own colour, so focus still shows there, but no outline 0 wide. It is
registered as not inherited, like the line's parts.

**A field typed into shows focus with its cursor** (`input` and `textarea` with `sf-field`, owner,
2026-11-27): no ring, its strength set to 0. Browsers show focus (`:focus-visible`) on such a field
clicked as well as tabbed to, unlike a button, so the ring made a click look like Tab, which most
sites don't. The browser's own cursor is the mark: the W3C's guidance names it a text field's focus
mark (Understanding 2.4.7, its examples; 1.4.11, its text input figure), so its colour is never
restyled. A dropdown has no cursor, so it keeps the ring, which a click doesn't show. Forced colours
still draws the outline. A quiet field's words are at full strength while it's typed in, contained
or not, as they're what's being written (owner, 2026-11-27); the rule names quiet, so it's in
quiet's layer and wins.

**A contained field shows focus as a field** (`sf-field sf-is-contained sf-on-focus`, owner,
2026-11-26, chosen from a mock-up of five ways): while it's typed in, it takes a field's surface
at half strength, with no ring, and full-strength words as any quiet field does. Half strength
puts it halfway between a field and the box it's in: a field's full surface on the dark bar was
too strong (owner, 2026-11-27), and the theme needn't know what the box is. It has no edge, as
nothing contained has one (owner, 2026-11-27). At rest it reads as a title (the editor's page
name). It stays contained while typed in, as it still is, so the look is the theme's rule, not
classes taken off. Its ring's strength is set to 0, so an error's line stays. The rule is a state
one (`sf-on-focus`), so the hover tint doesn't take its place while typing. Known gap: in the
light theme it barely shows on the bar (a field's surface there is 1.1:1, half of it less), as
light mode's surfaces are too close (to-do, "Current state").

### Fill parts

A box's fill is what it has for its loudness or kind (a loud button, a tinted danger box) or a
mark's own colour (an avatar, a badge). Its surface is what it's made of (a depth's surface, a
field, an ordinary button's faint tint). A context (`sf-is-overlay`, `sf-is-contained`, a pinned
cell) changes the surface, never the fill (owner, 2026-11-23). A context is a later layer than
a fill, so it used to wipe out a loud label's fill when it floated, and every fill when contained.

The fill is a part, as the line's are. The class that gives a box its fill passes
`--sfx-fill-color` and draws `background: var(--sfx-fill-color)`; a tint also passes
`--sfx-fill-border-color` and draws its border from it. Each surface and context draws
`var(--sfx-fill-color, <its own>)`, so whichever rule wins draws the same fill, and a fill
beats a surface on the same box. Both parts hold a whole colour and are registered as not
inherited: a box inside a loud one doesn't take its fill.

A theme changes a fill by setting its part, never `background`:

- On the selector the root theme draws the fill with, or a stronger one: a weaker selector
  loses to the root's (specificity counts before a theme's scope).
- A fill the root theme doesn't have passes the part and draws from it.
- A surface or context background of its own draws `var(--sfx-fill-color, <its own>)`, and a
  context's border `var(--sfx-fill-border-color, <its own>)`, or it paints over a fill.
- Hover and press paint over the fill with the root's colours (`sf-state`, a later layer), so
  a theme restyles them too.
- Being on (`sf-on-current`) draws its tint as `var(--sfx-fill-color, <the tint>)`, so a box
  with a fill keeps it while on, as with a context (owner, 2026-11-26).

### Text parts

A box's words say two things, each a part, as the line's and the fill's do (owner, 2026-11-25):

| Part                          | Says                                                                                 | Passed by                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Colour (`--sfx-text-color`)   | what the words are: a colour's words, or those for a fill                            | each colour (`sf-variant-*`); each fill                                                              |
| Strength (`--sfx-text-alpha`) | how strong: 60% quiet, 40% a quiet icon, full when hovered or a quiet field typed in | `sf-loudness-1`, `sf-icon` with it, `sf-on-hover`, an `input` or `textarea` with `sf-field` typed in |

A fill is a loud button, chip, tag, status or counter, a loud colour, an avatar or the switch's
knob; it passes its `fg_on_*` (or `fg_inverted`). Whatever passes the colour draws the words from
it at the strength passed, so quiet coloured words are that colour at 60%, with no rule of their
own. A field's hint (its placeholder) isn't its words: 50%, read by neither part, so hover
doesn't brighten it and it reads as nothing entered yet, the editor's "Untitled" too (owner,
2026-11-27). Picked and current read the colour, `var(--sfx-text-color, <the brand's words>)`: a coloured
thing keeps its colour and a loud one its fill's words, one rule each; current says it again
with hover, or the loud hover rule below would win on a loud link that is on. Under the pointer a loud
thing turns dark, so its words are its fill's, or light where it has no fill of its own (an
author's loud link).

Why: hover used to reset the words to the text around it (`color: inherit`, to undo quiet), which
took every colour's away, so picked, current and hover each needed a rule per colour to put it
back, 33 in all. Hover now passes full strength and leaves the colour alone: a warning stays amber
under the pointer, on a tint in its colour. Picked's words used to beat a loud fill's (violet on
lilac, 2.72:1).

Limits, none in the app: a plain loud button that is on doesn't darken under the pointer; a filled
box that is on looks nearly as it does off (only its edge changes); a quiet coloured avatar's
words are at 60% on its fill. Coloured words on a hover tint can dip under 4.5:1 (Portfolio
4.42:1).

A theme changes words by setting the part, never `color`, as with fills. Both parts are
registered as not inherited: a box inside a red or a quiet one doesn't take its words.

---

## Tokens

Tokens are CSS custom properties — the raw values everything else draws from. All system
tokens are prefixed `--sf-`. Two kinds, distinguished by separator:

**Range tokens** (hyphen): a fixed scale of slots.

```text
--sf-text-*       font size        (xs..9xl)
--sf-spacing-*    spacing scale    (none, xs..xl)
--sf-leading-*    line height      (none, tight, snug, normal, relaxed, loose)
--sf-tracking-*   letter spacing   (tight, normal, wide)
--sf-shadow-*     shadow elevation (sm..xl)
--sf-primary-*    primary palette  (1..9)
--sf-surface-*    neutral palette  (0..9)
--sf-alpha-*      channel-tint alpha values     (1..9)
--sf-opacity-*    element-wide opacity values   (1..9)
--sf-weight-*     font weight      (1..4)
--sf-radius-*     border radius    (0..3)
--sf-stroke-*     border/outline width  (1..3)
--sf-font-*       font family      (1, 2, 3, mono)
```

A theme sets the values; the slot set itself is fixed.

**Semantic tokens**: single shared values with a named meaning. Composite names use
underscores (`--sf-fg_primary`); single-word names don't (`--sf-primary`).

```text
--sf-fg_primary      default foreground
--sf-fg_inverted     foreground on brand/inverse surfaces
--sf-primary         brand colour: its fill, a step of the brand scale
--sf-danger          danger colour role (sf-variant-danger): its fill
--sf-warning         warning colour role (sf-variant-warning): its fill
--sf-success         success colour role (sf-variant-success): its fill
--sf-info            info colour role (sf-variant-info): its fill
--sf-primary_ink     the brand's ink: lines, focus edges, marks (a step of the brand scale)
--sf-danger_ink      danger's ink (an error's line)
--sf-warning_ink     warning's ink
--sf-success_ink     success's ink
--sf-info_ink        info's ink
--sf-fg_on_primary   text on a solid primary fill (loud primary/featured, a switch knob)
--sf-fg_on_danger    text on a solid danger fill
--sf-fg_on_warning   text on a solid warning fill
--sf-fg_on_success   text on a solid success fill
--sf-fg_on_info      text on a solid info fill
--sf-border_color    border colour
--sf-shadow          shadow colour
--sf-spacing_page    page margin: room at the screen's edges and around the header and footer
```

A theme changes the value; every reference picks it up.

`fg_on_*` follow the fill, not light or dark mode: a theme picks the text for its red,
amber and so on once, whichever mode is on. `fg_inverted` is for neutral fills (a fill
in the text colour), where flipping with the mode is right. A theme that changes a colour
role sets its `fg_on_*` to match, and its ink where the ink isn't the fill (below).

### Fill and ink

Each colour has a **fill**, which paints a surface (a loud button, a tint, an avatar) and stays
bright, and an **ink**, which draws on the page: the line round a block or a field, the code box's
focus edge, the switch's knob, a tick box (owner, 2026-11-24). An ink reaches 3:1 on its theme's
background (WCAG 1.4.11); a bright fill can't, and a fill dark enough to would make every loud
button and tint heavy. "Ink" names the job, not a border: a theme needn't draw borders at all.

Where an ink equals its fill, the root theme points it at the fill (`--sf-danger_ink:
var(--sf-danger)`), so a theme that changes the fill moves the ink with it. Where they differ
(amber and green on white), a theme that changes the fill sets the ink too, as it sets `fg_on_*`;
the root theme is always active, so an unset ink can't fall back to anything. The brand's fill and
ink are steps of its scale (4 and 6 in the root theme), so a theme that sets the scale moves both.
Pointing works because the theme class sits on `<html>` with `:root`, so `var()` resolves with
the active theme's values.

Every colour has an ink even where nothing in the root theme draws with it yet (success, info): a
theme or component author drawing a green or blue line needs one, and it's the common case for a
builder (owner, 2026-11-24). An ink with its own value is offered in the colour tools, as every
colour with a value is; one that points at another colour is offered under that colour's name.

**Coloured words** are neither: each colour's words are the colour mixed half with the text
colour, chroma doubled (`oklch(from color-mix(in oklab, <colour> 50%, <text>) l calc(c * 2) h)`),
which reaches 4.5:1 on the page in both themes. The brand's words (links in running text,
`sf-variant-primary` and `-featured`, `sf-on-current`, `sf-on-ancestor`) take the same rule;
plain lilac on white is 2.04:1. Quiet brand words are the brand's words at quiet's 60%, 2.52:1,
short of 4.5:1 for now. A menu's parent item (`sf-on-ancestor`) was the brand at 70%,
1.53:1 on the light header; it now shares the current item's words without its tinted box, so
plain, parent and current still differ (owner, 2026-11-24).

**Edges** follow what they're for (owner, 2026-11-24). A field and the code box
(`sf-content-frame`) at rest: the text colour at 60%, as an empty field has nothing else to show
it's there, so its edge needs 3:1 (light 4.08, dark 6.61). Ordinary buttons and chips: the text
colour at 30%, which is looks, as their words mark them out. Dividers, cards and tables:
`--sf-border_color`, as they only separate.

### Colours and alpha

Colours are stored as RGB triplets — three space-separated values, no `rgb()` wrapper:

```css
--sf-primary-5: 178 143 232;
--sf-fg_primary: 38 40 36;
```

Composed at the use site:

```css
background: rgb(var(--sf-primary-5)); /* solid */
background: rgb(var(--sf-primary-5) / 0.5); /* literal */
background: rgb(var(--sf-primary-5) / var(--sf-alpha-3)); /* range token */
```

One colour token serves all opacities — the class count stays linear instead of
multiplicative.

**Use-site composition is the rule for the design system.** Component CSS, bundles, and
theme overrides all compose opacity at the use site against `--sf-alpha-N` tokens.
Recurring tinted values that warrant theme tracking get their own semantic token.

**Picker-driven colour picks land in the class layer, not inline.** A picker UI emits a
class pair (`sf-bg-primary-5` + `sf-bg-alpha-3`) so cascade specificity stays well-behaved
— inline style outranks every layer, which would block state classes (`sf-on-hover`,
etc.) from overriding the picked colour. The class pair works because the colour utility
sets a runtime modifier var (`--sf-bg-alpha`) reset to `1`, and the alpha class overrides
it. The reset is required to fence the cascade against itself.

This pattern applies uniformly to every picker-driven colour surface: `sf-{bg|color|border|shadow-color}-*`
palette utilities and their `sf-{bg|color|border|shadow}-alpha-*` siblings. Component
authors don't reach for it — they pick the colour token whose value already encodes the
opacity they want, or compose at the use site. Bundles paint solid and don't participate.

**The colour tools offer the theme's colours only** (owner, 2026-11-14). A free colour is
fixed: a theme change doesn't reach it, and as inline style it outranks the state classes. A
colour not from the theme that a page already has (pasted, or written in the code view) is kept,
as the browser reads it, and `prefer-theme-color` points it out; picking a theme colour replaces
it. Text can wear a theme colour and a fixed one together, the fixed one showing: the warning
points that out too, rather than the page dropping either. If free colours are ever wanted,
they're a tool of their own, not part of the theme's colour tools.

The tools keep a theme colour as its names, the colour's and its see-through step's (`primary-5`,
`3`), from the class they read to the class they write, so nothing is turned into a colour value
and read back: a class the theme makes no colour for (`sf-color-primary`) is written back as it
came, and a see-through step needs no theme tokens to be kept.

### Corners

**The Corners tool offers the theme's sizes only** (owner, 2026-11-14), as the colour tools offer
its colours: a size in pixels doesn't change with the theme. Its row is "none", then the theme's
sizes (`sf-radius-0` … `sf-radius-full`):

- **none** takes the setting off, so the block's corners are the theme's for it: a Card's are
  rounded (8px in the default theme), a paragraph's square. A theme change reaches them.
- **0** is square whatever the theme does for the block: a Card set to 0 stays square.

A block's own corner size (in its style, from a paste or the code view) shows over its class.
It's kept, as written, and the tool says "Not a theme size", as it does for a size class the theme
doesn't have; picking a size or none replaces it. `prefer-theme-radius` points it out. The tool
doesn't read the size's value, so any way of writing one (a single corner, logical corners, oval
corners) is kept whole, and `0` or a theme size written in the style says "Not a theme size" too
(owner, 2026-11-14), as the colour tools say of a colour in a block's style. Which properties set a corner is one list, `shared/corners.ts`, read by the
tool and the rule.

A class for one corner waits until someone needs one: adding it later changes nothing stored.

### When a token belongs

Three rules:

**Used in more than one place.** A token earns its place only if its value is used in more
than one place. A token used in exactly one class is an indirection — replace it with the
primitive it points to.

- `--sf-shadow` ✓ — every shadow references it
- `--sf-card-radius` ✗ if it only appears in `.sf-card`; use `var(--sf-radius-2)` directly

**Aliases only for theme-level decisions.** A semantic alias over a scale step is
legitimate only when it represents a theme-level choice. `--sf-primary` = `--sf-primary-4`
is valid because the theme decides which palette step is the brand. `--sf-alpha-subtle` =
`--sf-alpha-3` is not — "subtle" is a styling opinion, not a theme decision. Use the
scale step directly.

**Compose before naming.** If a value can be built at the use site from existing tokens
(`var(--sf-stroke-1) solid rgb(var(--sf-border_color))`), do that — a new composed token
earns its place only when themes would plausibly override the whole treatment as a unit,
not just its parts.

---

## sf- classes

Six layers in cascade order. The same authoring pattern applies everywhere — defaults
and theme overrides both live inside the matching `@layer` block:

```css
@layer sf-bundle {
	/* default — uses tokens for values */
	.sf-depth-1 {
		background: rgb(var(--sf-surface-1));
		box-shadow: var(--sf-shadow-md);
		border-radius: var(--sf-radius-2);
	}

	/* theme override — same layer; the nearest theme wins */
	@scope (.theme-flat) {
		.sf-depth-1 {
			box-shadow: none;
			border: 1px solid rgb(var(--sf-border_color));
		}
	}
}
```

Tokens for values. Class overrides for which properties to use. Theme authors work
entirely within the shared token vocabulary — no class-specific intermediate tokens.

**The vocabulary is the contract; the CSS properties a class expresses are the theme's
choice.** A `sf-depth-1` may set `background + shadow + radius` in one theme and
`background + border` in another. Consumers outside the class don't reach for specific
properties — they either wear the class or read a bridge variable (`--sfx-*`) the class
sets by contract.

### Bundles — `sf-bundle`

Multi-property classes that establish a coherent set of CSS properties as a unit.

**Depth** — visual layer position. Tells the theme where an element sits in the perceived
UI hierarchy so adjacent layers look correct together. A depth-2 dropdown sitting on a
depth-1 card needs to read as above it — depth coordinates that relationship regardless
of how CSS implements the actual stacking.

```text
sf-depth-0   canvas / page
sf-depth-1   cards, wells
sf-depth-2   dropdowns, popovers
sf-depth-3   modals
```

**Headings** — typographic prominence. h1–h6 encode document outline position; these
classes carry visual prominence, which does not always align — a deeply nested section's
h1 may need heading-2 treatment:

```text
sf-heading-1   most prominent
sf-heading-2   secondary
sf-heading-3   tertiary
```

**Loudness** — attention hierarchy among sibling content blocks. Higher number = more
attention, consistent with the rest of the numbered scales in the system:

```text
sf-loudness-1   lowest attention — de-emphasised, supporting content
sf-loudness-2   moderate attention
sf-loudness-3   highest attention — most visual weight, spacing, prominence
```

Loudness is an absolute scale of attention weight, not a claim about neighbours. A block
set to `sf-loudness-1` carries maximum visual weight on every page it appears, whether or
not any `sf-loudness-2` or `sf-loudness-3` blocks are present. The theme applies the same
treatment consistently — the block declares its level and the theme decides what each level
looks like.

The theme decides which CSS properties express each level — scale, padding, type weight,
contrast, or a combination. Depth coordinates layering relationships; loudness is
independent of that — a depth-2 dropdown can be any loudness.

**Size** — form-factor scale. Declares how large or tight the block reads. The theme
picks which properties express each step — padding, border weight, gap, or a
combination. Whether size changes padding is the theme's choice; **how** is not: any
padding a theme gives `sf-depth-*` / `sf-size-*` goes through `--sf-padding`
(`padding: var(--sf-padding)`), never a hard-coded `padding`. Layout reads it — an inset
card uses it as its margins — so a theme that pads directly breaks alignment silently.
Shape stays _out_ of size: a compact breadcrumb and a compact pill both want the same
scale but different radii, so `border-radius` comes from the element's own rule (bare
`<button>`, `<input>`) or an explicit `sf-radius-*` utility. Decoupling lets an author
pick scale and shape independently rather than getting one when they wanted the other.

```text
sf-size-2xs  very tight — breadcrumb, dense chip
sf-size-xs   compact — icon button, small tag
sf-size-sm   small — small button
sf-size-md   standard density
sf-size-lg   large — featured tile
sf-size-xl   hero scale
```

Size is independent of depth and loudness. A small pill can be `sf-depth-2 sf-loudness-1
sf-variant-featured sf-size-xs sf-radius-3`; the axes do not constrain each other.

Absence of `sf-size-*` is a valid, meaningful state. The theme decides what the default
scale is for any given element type; `sf-size-*` is the author's explicit override.

**Boundary** — visual separation on the element's own sides. The theme decides the full
treatment; the default is a themed border, but themes may compose multi-property (line
weight, style, colour, spacing increase). No scale step is involved; the hyphen is a
positional qualifier, not a scale selector.

```text
sf-boundary-top
sf-boundary-bottom
sf-boundary-left
sf-boundary-right
sf-boundary-x      left and right
sf-boundary-y      top and bottom
sf-boundary        all four
```

**Divide** — visual separation between an element's children (applied to the parent).
Targets `> * + *`. `sf-divide-y` pairs naturally with `sl-stack`; `sf-divide-x` with
`sl-cluster` or `sl-columns`. A child hidden at this width (`sl-hide-below-*`,
`sl-show-below-*`) doesn't count, so lines go only between shown children: hiding the first
leaves no line at the top (Container-responsive collapse).

```text
sf-divide-x    between horizontally arranged children
sf-divide-y    between vertically arranged children
```

New bundle families join this layer through the second-level admission test in
Vocabulary Governance.

### Element markers — `sf-element`

Class analog of a bare HTML element rule. HTML has some element categories baked in —
`<button>`, `<nav>`, `<table>`, `<mark>` — that themes decorate via bare element rules.
Real UI categories HTML forgot (chip, tag, counter) need class markers to give themes
something to decorate. Markers sit in their own cascade layer (`sf-element`, below
`sf-bundle`) so they behave the way HTML elements do — a baseline that bundles, variants
and states override predictably, without depending on source order to break ties.

```text
sf-chip          compact unit standing for an input, attribute or action — an
                 entered item, a filter, a choice, a suggestion. Any element:
                 static on a <span>, or with sf on a <button> / <a>
sf-tag           short read-only label naming a category the item belongs to
sf-status        short read-only label saying what state something is in
sf-counter       short read-only label holding a count (3 unread, +2 more).
                 The four compact units are separate element types, so a theme
                 can draw them alike or tell them apart. Worn with
                 sf-single-line
sf-badge         a mark saying there's something there to look at, with nothing
                 in it, in the line where it's written; over a box with sl-over
                 (Placing a box over another). A count there is a counter
                 (sf-counter sf-is-overlay), so counts are styled in one place.
                 It keeps the theme's size: a row or stack short of room
                 doesn't squash it, as it has no content to hold it open
sf-icon          content is a single icon (font icon or SVG). line-height:1
                 removes leading so padding drives vertical spacing
sf-single-line   content is a single line of text. line-height:1 removes the
                 half-leading that would otherwise inflate vertical spacing
sf-text-block    non-semantic wrapper (<span>/<div>) holds text — declares
                 text-holder intent for containers whose HTML tag doesn't
                 already imply it. Theme picks the leading
sf-switch        on/off switch track — worn with sf on a <button role="switch">,
                 which stays the floor; adds the pill shape and knob gap
sf-thumb         the knob that moves along a track (switch knob, custom slider
                 handle); may hold an icon. sf-on-current when its track is on
sf-toast         a short message that pops up over the page and goes by itself —
                 worn with sf-depth-*, sf-is-overlay, a loudness and a variant for
                 its kind. The hook a theme styles toasts by; its own default is
                 bold text, since a toast is glanced at
sf-drag-handle   drag affordance — dim at rest, accents to primary on hover
                 and while dragging
sf-swatch        small colour-surface tile — palette chip, preview.
                 Theme decides border/radius/padding; consumers set width/height
sf-field         editable form-control chrome shared by input/select/textarea —
                 border, radius, font, padding-bridge
sf-scrim         modal backdrop — darkening + blur overlay for dialogs/modals.
                 Chrome only; consumer owns positioning (fixed, inset:0, z-index)
sf-content-frame frame around focusable content that itself is not focusable —
                 third-party editor wrappers, contenteditable containers, iframe
                 hosts. Border + :focus-within primary-border response
```

**A marker only declares what's unique to the category.** Everything a chip and a card
have in common with any other element — background, elevation, density, hover, focus,
muted attention — already comes from depth, loudness, size, variants, states. The marker
carries only the _residual_ the composable axes can't express: a shape convention the
theme prefers for chips (square edges when the theme's default is round, or the reverse),
a colour treatment specific to counters, whatever the category demands after the axes have
done their work.

**Markers stack additively over the underlying element.** `<button class="sf sf-chip">`
wears both — `button.sf` provides the button baseline;
`button.sf-chip` compound refines chip-specific properties (r-3 shape, tighter alpha
border). A theme that hasn't defined the compound still produces a working button — the
element rule is always the floor. Markers never replace the underlying identity; they
add and refine.

Elements without a baseline in the vocab (e.g. `<span>`) wear a marker without any `sf`
membership marker, because a span has no baseline to admit: `<span class="sf-tag">` is
styled by the marker's own rules, which are the floor in that case.

**What a marker never carries: arrangement.** Whether text wraps, how an element sits
among its neighbours, and what makes a box a box (`display: inline-block` so a span's
padding applies) are the same under every theme. Wrapping belongs to the parent's layout
(`sl-*`) or the component; structural display goes in the fixed reset. A theme that could
change them would reflow the page.

**Admission test:** after depth + loudness + size + variant + state have applied, is there
anything left that's specific to this category?

- **`sf-card` — rejected.** `sf-depth-1 sf-loudness-*` already produces card. Nothing
  category-specific remains, so a marker would just be an alias for a class combination
  authors can write directly. Categorising for its own sake earns nothing.
- **`sf-chip` — accepted.** Chips typically want a shape distinct from whatever the theme
  gives bare buttons (pill when buttons are square, or square when buttons are pill) —
  a category-specific choice not derivable from depth/loudness/size. Same shape as
  bare `<button>`'s rule setting `border-radius: var(--sf-radius-2)`: a residual the
  composable axes can't express.

If a marker ends up with zero rules after the axes cover the general case, the marker
isn't earning its keep — collapse it back into the axes. The exception is a component's
own marker (`sf-toast` began this way): the axes may cover its default look, but a theme
still needs a name to style that component by, so the marker may start with no rules as
that hook.

**Rules combine on one element, never "inside X".** A theme rule is an element plus the
classes and states on that same element — no ancestor selectors. When a component needs
a category-specific look, it puts the category on the element itself: an HTML element
where one exists (`menu.sf-is-nested` — a nested group in a menu), else a marker
(`sf-tree.sf-is-nested`, once trees exist). Themes stay "this element with these classes
looks like this", which a theme editor can show.

### Variants — `sf-variant`

Semantic intent modifiers. The variant overrides only the bundle properties it touches;
every other bundle property survives. The variant tells the theme what role this element
plays so it can be expressed appropriately — a star, a colour, a badge, whatever fits.

```text
sf-variant-featured   editorially selected or promoted — a featured product, a highlight
sf-variant-primary    primary colour role — the theme's brand colour; a main action is
                      `sf-loudness-3 sf-variant-primary`, a quieter one a lower loudness
sf-variant-danger     destructive action — delete, remove, irreversible — or a failure
                      being reported (an error message)
sf-variant-warning    cautionary — something needs attention but is not destructive
sf-variant-success    positive outcome — confirmation, completion, approval
sf-variant-info       something to know that is neither good nor bad news — a hint, a tip
sf-variant-alt-1      alternative visual form — distinct rendering of the same class combination,
                      no semantic intent beyond looking different from the default
```

Variants are not about visual weight — that is loudness's job. Colour roles (primary,
danger, warning, success) combine with any loudness: `sf-loudness-3` alone is a loud button
in the theme's neutral form; add `sf-variant-primary` for the brand colour. Featured is not
a colour role — it claims promotion, a level above a main action. `sf-variant-featured` on a
small pill and on a full-width hero section both signal the same intent; the theme decides
how to express it at each size.

On a box, loudness steps the same box up: a variant alone colours the text,
`sf-loudness-2` adds a tint and a border in that colour, `sf-loudness-3` fills it solid
with the matching `fg_on_*` text in bold. The loudness-2 shades are solid: the colour mixed
into the page colour (`--sf-surface-0`), so they look the same on any surface and follow
dark mode. Coloured text is the colour moved halfway to the normal text's brightness with
its colourfulness kept, so it reads on light and dark alike. One colour value per role
serves both modes. Hover and press step each fill a little further without losing it.
A floating or contained box keeps its fill ("Fill parts"): the tint is solid, so the page
doesn't show through, and a floating tint keeps its depth's shadow (read through
`--sfx-depth-shadow`).

**Quiet is a shade of the text around it.** Quiet text, quiet icons and hover and press
tints are made from the text colour where they sit (`currentColor`), not from the theme's
`fg_primary`. So a quiet close button on a solid red box is a faded version of that box's
white text, and on a card a faded version of the card's text. Each box sets only its own
text colour: a solid fill its `fg_on_*`, a `sf-depth-*` surface the theme's `fg_primary`, so
a card inside a coloured box has normal text again. No rule redefines a theme token.
Quiet passes its strength rather than a colour (60%, an icon 40%; "Text parts"), so a colour's
words read it too, and hover passes full strength.
A marker with its own colour that is worn with a depth (`sf-drag-handle`) needs a compound
with that depth, since depth sits in the higher layer.

### Context — `sf-context`

The element's own situation, as classes: where it sits, or what state it's in. Code adds
them while they're true (measuring the page, or from the app's own state: loading, an
error), or the author writes them where they're a plain fact. Not what a person is doing
with it, which is a state (`sf-on-*`, below).

```text
sf-is-edge-top         element is flush with the top viewport edge
sf-is-edge-right       element is flush with the right viewport edge
sf-is-edge-bottom      element is flush with the bottom viewport edge
sf-is-edge-left        element is flush with the left viewport edge
sf-is-overflow-top     content is clipped at the top
sf-is-overflow-right   content is clipped at the right
sf-is-overflow-bottom  content is clipped at the bottom
sf-is-overflow-left    content is clipped at the left
sf-is-overlay          element is physically positioned over other content; worn by
                       a placed box (sl-over) too
sf-is-loading          element is in a loading / pending state; a busy button stays
                       enabled (aria-disabled) so it keeps focus
sf-is-sticky           a sticky element is currently in its pinned position
                       (sl-pin-* makes it sticky; this is the stuck state)
sf-is-error            element or field is in a validation / error state
sf-is-warning          element or field needs a look but is not in error
sf-is-disabled         looks disabled because the author says so, and stays
                       interactive (a control the browser disables wears sf-on-disabled)
sf-is-contained        element sits inside a container that already provides
                       visual boundary
sf-is-nested           group sits inside another group of the same kind (a nav
                       group, a tree level, a reply thread) — worn at every level
sf-flush               container holds content edge-to-edge (opt-out of
                       chrome-class padding default)
```

`sf-is-contained` is author-declared (like `sf-is-edge-*`) — the DOM structure is
static, no JS detection needed. The class only _declares_ the condition; the theme
decides how to express it. The default expression is to drop the element's own
chrome (its surface and border) since the parent already delineates, never a fill or a
tint's border ("Fill parts"), but a theme is free to soften it differently — reduced padding,
muted colour, no change at all.
Element-agnostic: applies equally to a `<button>` inside a card, a nested
card-shaped `<div>`, or anything else that would otherwise draw its own container.

`sf-flush` opts out of the chrome-class padding default — wear alongside `sf-depth-*`
when the child touches the container's inner edge (image cards, toolbar slots).
**Follow-up:** move padding to an `sl-pad-*` layout family
so `sf-flush` isn't needed — an image card becomes bare `sf-depth-1`, a padded card
becomes `sf-depth-1 sl-pad-md`.

`sf-is-nested` is also author-declared, and it repeats: each nested level wears it, with
no level numbers. So its look must add up by itself — an indent inside an indent, a
see-through tint over a tint, a guide line per level — never a depth step, which is a
short, fixed ladder of surfaces. How deep a component nests is the component's call.

Every `sf-is-*` class declares _intent_, never appearance. `sf-is-overlay` means
"this element is floating over content" — not "this element is pill-shaped." The
theme reads the intent and picks the expression: a compound like `button.sf-is-overlay`
setting a pill radius is the theme's opinion that floating action buttons read as
chip-shaped tokens. Component authors declare intent (`sf-is-overlay`); shape,
colour, elevation are the theme's calls.

**`sf-on-*` or `sf-is-*`** is chosen by what the class is about, not by who sets it:

|          | `sf-on-*` (States)                                                                                                                                                                          | `sf-is-*` (Context)                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| About    | what a person is doing with the element                                                                                                                                                     | the element's own situation                                 |
| Examples | hovered, focused, pressed, picked, current, being dragged                                                                                                                                   | at an edge, floating, loading, in error, needs a look       |
| Set by   | the browser, where it has the state (`:hover`, `:focus-visible`, `:active`, `:disabled`): the class is worn always and the browser says when; otherwise code or the author, while it's true | code while it's true, or the author where it's a plain fact |
| Layer    | `sf-state`, above `sf-context`: what a person does shows over a fact                                                                                                                        | `sf-context`                                                |

Who sets a class can change (an author writes `sf-is-nested`, code adds `sf-on-selected`);
what it's about doesn't, and the layers follow it. So a fact that must stay visible while a
person acts can't rely on its rule winning: the line's parts carry an error's colour and dashes
through a picked or targeted line, whichever rule wins (Line parts).

`sf-on-disabled` and `sf-is-disabled` show the difference. The first is a control the
browser has disabled (`:disabled`): it can't be used. The second only looks disabled because
the author says so, and can still be used.

Multiple `sf-is-*` classes may be present simultaneously and can be compounded in rules
— a rule requiring both `sf-is-overflow-left` and `sf-is-overflow-right` handles the
both-edges case at higher specificity than either alone.

### Semantic — `sf-semantic`

Single-property classes that bind one CSS property to a shared semantic token (underscore
naming, mirroring the token name).

```text
sf-fg_primary    color:        rgb(var(--sf-fg_primary))
sf-border_color    border-color: rgb(var(--sf-border_color))
```

The author signals "this property should track a theme value"; the theme controls the
value.

### Utility — `sf-utility`

Single-property classes that bind one CSS property to a specific scale step (hyphen
naming, mirroring the token name).

```text
sf-radius-3        border-radius:   var(--sf-radius-3)
sf-shadow-md       box-shadow:      var(--sf-shadow-md)
sf-text-xl         font-size:       var(--sf-text-xl)
sf-leading-snug    line-height:     var(--sf-leading-snug)
sf-tracking-wide   letter-spacing:  var(--sf-tracking-wide)
sf-font-1          font-family:     var(--sf-font-1)
sf-weight-3        font-weight:     var(--sf-weight-3)
sf-gap-md          --sf-gap:        var(--sf-spacing-md)
sf-padding-lg      --sf-padding:    var(--sf-spacing-lg)
```

`sf-gap-*` and `sf-padding-*` set runtime-state custom properties (`--sf-gap`,
`--sf-padding`) that layout primitives read — this is how the styling system feeds
spacing into the layout system without compromising layout's structural fixity. They
apply to the element that wears them only (see Layout channels).

`sf-shadow-*` uses `rgb(var(--sf-shadow) / var(--sf-shadow-opacity))` as its default
colour composition, both theme-controlled. Colour picks follow the same class-pair pattern as
bg/text/border: `sf-shadow-color-*` + `sf-shadow-alpha-*` (in `sf-utility`). A page's own
`style="--sf-shadow-color: ..."` sets the same var and beats the layered classes.

### States — `sf-state`

What a person is doing with the element (Context has how these differ from `sf-is-*`).
A bare rule applies everywhere the class appears; a compound
selector overrides it at higher specificity. Write one bare fallback, then only the
combinations that need a different treatment — the full depth × variant matrix does
not need to be specified explicitly.

```text
sf-on-hover      hovered (:hover)
sf-on-focus      keyboard focus (:focus-visible)
sf-on-active     pressed (:active)
sf-on-disabled   a control the browser has disabled (:disabled)
sf-on-selected   picked: the chosen option of a set, which sets a value — a colour
                 swatch, a font size, a tab (code-set)
sf-on-targeted   picked out as a whole to be acted on: the next action applies to it —
                 ticked rows, files, shapes, the editor's selected blocks; not a cursor
                 or highlighted text inside it (code-set)
sf-on-current    the one on now, which Enter would use — the mark applied, the page
                 in a nav, the node path's last crumb (code-set)
sf-on-ancestor   on the path to sf-on-current but not it — a nav parent, an earlier
                 crumb (code-set)
sf-on-dragging   being dragged (code-set)
```

`sf-on-selected` or `sf-on-targeted`: is this choosing a setting, or gathering things to act
on? Both can be one or several. Each draws its own part of the line (Line parts), so an element
can be both.

```css
@layer sf-state {
	/* bare rule — fallback for all contexts */
	.sf-on-hover:hover {
		background: rgb(var(--sf-fg_primary) / 0.05);
	}

	/* compound — overrides only where featured needs different treatment */
	.sf-variant-featured.sf-on-hover:hover {
		background: rgb(var(--sf-primary) / 0.05);
	}
}
```

---

## sl- layout subsystem

Arrangement has its own prefix because it's a separate concern from appearance. Both
prefixes coexist on the same node:

```html
<div class="sl-columns sf-depth-1 sf-variant-featured sf-gap-lg"></div>
```

`sf-*` utilities set runtime variables that `sl-*` primitives read; the reverse is not
a pattern.

The maintainer defines what `sl-` classes do; a theme changes layout only through the
tokens they read (gap, page margin, padding, breakpoints). What two `sl-` classes mean
together (a cluster that scrolls, a bleed inside an inset) is part of that definition,
not a theme rule.

So their CSS is fixed, emitted by the generator after the root theme's rules: what each class
does (`api/src/domain/css/slLayout.ts`), image fit (`slObject.ts`), classes together
(`slCombined.ts`), and collapse, built from the theme's breakpoint tokens. The class names
are in the DB vocabulary. A theme's own rules on `sl-` classes set looks only — the
hidden scrollbar on `sl-scroll-x`, a scroll frame's arrows. Nothing enforces that yet: a
non-root theme's rules are scoped (`@scope`), and a scoped rule beats an unscoped one of
equal specificity, so a theme rule setting an `sl-` class's layout would win. Holding
themes to looks is a job for the validator (not built; see Validator and linter).

### Layout primitives

Nine structural patterns:

```text
sl-stack      vertical stack
sl-cluster    horizontal wrap
sl-columns    grid — equal or custom ratio via --sl-cols
sl-split      one fixed-width side, one flexible side
sl-center     max-width centering
sl-inset      vertical stack with side margins a child can reach into (sl-bleed)
              and content lines up with (sl-inset-line)
sl-cover      fills at least 100dvh with content centred — empty states,
              hero sections, standalone forms. Override via --sl-cover-min
sl-grid       auto-responsive — fills with as many columns as fit at a minimum width
              (--sl-min, default 250px)
sl-aspect     aspect-ratio container — ratio configured via --sl-aspect
```

**One arrangement per box.** A box takes one of the classes that arrange what's inside it:
`sl-stack`, `sl-cluster`, `sl-columns`, `sl-split`, `sl-grid`, `sl-inset`, `sl-cover` or
`sl-row` (below), the layouts the fixed CSS lists (`GAP_LAYOUTS` in `shared/layouts.ts`), or
`sl-scroll-frame`, which wraps one scroll area (Scroll areas and pinned elements) and spaces
nothing with a gap, so it's off that list (`ARRANGEMENTS` there has both). Two on one box
clash where they set the same thing, so the box gets parts of each: Columns that are also a
frame are one column. For two, put one box in the other. `sl-center` and `sl-aspect-*` don't
arrange what's inside: one makes the box a centred column, the other gives it a shape, so either
goes with an arrangement. The Centre block
is `sl-center sl-stack`, a centred column whose blocks are spaced as a stack's (a centred stack
is padded only at its sides). A component block counts its component's own: a Stack and a Centre
stack their blocks, and Columns, Split and Cover arrange theirs, so none takes another, `sl-row`
and `sl-inset` included. A Card has none of its own, so for a row or a band use a Card or a
plain block.

Alignment modifiers compose with any layout. On every layout x is sideways and y is up and
down. `sl-cover` centres by default.

```text
sl-align-y-start   top
sl-align-y-center  middle
sl-align-y-end     bottom
sl-align-x-start   left
sl-align-x-center  centre
sl-align-x-end     right
```

Aligned sideways, a layout's items take their content's width instead of the full width.
On a stack, y alignment shows only when the stack is taller than its content. On `sl-over`
they say where the box sits (Placing a box over another).

A row of items side by side (`sl-columns`, `sl-split`, `sl-grid`, `sl-row`) stretches them to
its height unless it's aligned. A shape (`sl-aspect-*`) counts as a height of the block's own:
a block with one keeps its shape at the top of the row instead of stretching (and widening to
keep its shape). A centred column (`sl-center`) is as wide as its measure allows in a row, a
stack or an inset, not as wide as its text; in a layout aligned sideways it takes its
content's width, as the other items do.

**A picture's space before it loads.** Until its file arrives a picture has no height, and
the page grows when it does, unless it has a size of its own: its width and height in the
HTML (the file's), a shape with a fill (`sl-aspect-*` with `sl-object-cover`, `-contain` or
`-fill`), or a frame with a shape and a fill that it's the only block of. A shape alone isn't
enough: the width still comes from the file. A size in the picture's own style doesn't count,
so there's one way to give a picture its size (owner, 2026-11-09). A frame is a plain box or
a block with a layout: a Card with none keeps its blocks in a box of its own (only a layout's
content box steps aside, Component blocks), which the fill doesn't reach, so a Card that frames
a picture takes a layout too, such as Stack, as it always has (owner, 2026-11-09). The shapes
and those fills are listed once in `shared/layouts.ts` (`SHAPES`, `FILLS`), which the fixed
CSS and the validator read.

**Rows that share columns** — `sl-row` on a child of a grid layout (`sl-split`,
`sl-columns`, `sl-grid`) makes it span every column and put its own children on the
parent's columns. Separate row elements then line up as if their cells were in one grid:
name/field forms, key/value lists, menus with a shortcut column.

```html
<div class="sl-split sf-gap-2xs">
	<div class="sl-row sl-align-y-center">
		<label for="a">Name</label>
		<input id="a" />
	</div>
	<div class="sl-row sl-align-y-center">
		<label for="b">Longer name</label>
		<input id="b" />
	</div>
</div>
```

- A row's children fill the columns in order; extras wrap onto a new line within the row.
  Wrap a group (input plus buttons) in one element to keep it in one cell.
- The parent's gaps and collapse apply: `sl-split sl-collapse-sm` stacks each name above
  its field on narrow widths.
- It only changes where cells are drawn. Reading and tab order stay the source order —
  don't reorder cells visually. Screen readers don't hear rows and columns; data you
  navigate as a table stays a `<table>`.

`sl-columns` and `sl-split` are not variants of each other. Columns is proportional
(equal or custom ratios via `--sl-cols: 1fr 2fr`). Split is fixed-plus-flexible — one
side holds its width, the other takes the rest.

### Side margins and full-bleed

`sl-inset` is a stack whose children sit inside side margins. The inner edge of those
margins is **the line** — where content starts. `sl-bleed` on a direct child lets it span
the margins and reach the inset's edges; `sl-inset-line` on any element puts its content
back on the line.

```html
<div class="sl-inset">
	<h1>Title</h1>
	<!-- on the line -->
	<img class="sl-bleed" … />
	<!-- edge to edge -->
	<div class="sl-bleed sf-depth-1 sl-inset-line">
		<!-- background edge to edge, -->
		…
		<!-- content on the line -->
	</div>
</div>
```

**How wide the margins are**

- The outermost inset uses the page margin, `--sf-spacing_page` — a theme value for the
  room between the screen's side edges and content. The app uses the same room above the
  header and between the header, the page and the footer, so a page has no top or bottom
  room of its own to add. The editor shows its own bars in place of the header and footer, and
  while it's editable the page scrolls on until its last line sits under them; that room isn't
  the theme's.
- The page's content column stops growing at the page width, `--sf-width_page` — a theme
  value (default 80rem). Past it the column centres and the margins grow to fill the rest;
  bleeding children still reach the screen edges, and the line moves with the column. A
  very large length turns the limit off. Every page gets it; there is no per-page opt-out.
- Any plain inset starts a page: inside a box wider than the page width (a screen-wide
  card that isn't itself an inset), its content centres at the page width again.
- An inset that bleeds inside another carries the same margin, so they share one line.
  One that doesn't bleed sits inside the line, so its content moves in by another margin.
- An inset on a chrome box (`sf-depth-1 sl-inset`) uses that box's own padding — whatever
  the theme gives it. The card looks unchanged, and its children can bleed to its edges.
  Everything inside lines up with the card instead of the page. The page width limit
  doesn't apply inside it: the card's column is its full width.
- Unless that box actually bleeds (a direct child of an inset): its edges are then the
  parent's edges, so the parent's line carries on through it. A coloured band
  (`sl-bleed sl-inset sf-depth-1`) keeps the page line. Where `sl-bleed` does nothing, the
  card keeps its own padding.

**Putting content on the line** — `sl-inset-line` sets the element's side padding so its
content starts on the line of the inset it sits in, whatever the box's own width. Use it
on something that already spans the full width: a bleeding child, or something that spans
the screen outside any inset (a tool bar). Outside any inset there is no page column, so
its content sits one page margin from the screen edge at any width. Common shapes:

| Want                                                     | Classes                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Image or block edge to edge                              | `sl-bleed`                                                                     |
| Band, stack of content                                   | `sl-bleed sl-inset` (children can bleed again)                                 |
| Band or bar, row of controls                             | `sl-bleed sl-inset-line`                                                       |
| Scrolling table: starts on the line, scrolls to the edge | flush box `sl-bleed`, scroll area `sl-scroll-x sl-inset-line`                  |
| Screen-wide bar, content full width (a tool bar)         | `sl-inset-line`, outside any inset                                             |
| Screen-wide bar, content lines up with the page (a nav)  | wrapper `sl-inset` (sticky/edge classes go here), bar `sl-bleed sl-inset-line` |

A padded box between the line's owner and an `sl-inset-line` element adds its padding on
top — the content ends up one padding further in. A pinned edge (`sl-pin-*`) stays flush:
pinning wins over the line.

**A document in an inset.** The editor, the home page and the preview show a page's document
in the page shell, an inset. A collection's sheet is an inset too, its padding the margin.
Whatever shows a document decides whether it sits in an inset. The document's own blocks count
as the inset's children:

- They sit on its line, and one set to bleed reaches its edges.
- A band or bar keeps its content on the line, as in the table above.
- Outside an inset, a document has no margins of its own, so it can be shown anywhere.

TipTap puts two boxes between the inset and the blocks, so it works differently underneath
(`slLayout.ts`, `slCombined.ts`). The box TipTap mounts the document in wears `page-content`
and must be the inset's own child. `PageContent` adds the class; a component that uses
TipTap's `EditorContent` directly adds it itself. The document pads itself to the line. A bleeding block
pulls out of that padding to the width of TipTap's box around the document, which is
measured. A block that is both `sl-center` and `sl-bleed`, a Centre block set to bleed
included, goes edge to edge instead of staying centred. That combination isn't supported
(Validator and linter, "no-bleeding-center").

**Rules**

- **Nothing is assumed.** A plain inset only reads the margin; only boxes that set their
  own padding publish one. Outside an `sl-inset`, `sl-bleed` does nothing.
- `sl-inset` arranges its children, so it takes no other arrangement (Layout primitives, "One
  arrangement per box").
- **Direct children only.** Bleed reaches the nearest inset. A document's own blocks count
  as its children.
- **The page margin and page width are lengths**, not percentages — tracks and padding
  resolve percentages against different widths. `clamp()` and `vw` are fine.
- `sf-is-edge-*` only says a box touches the screen edge; the theme decides the look
  (default: square the touching corners). It adds no spacing.

Not yet covered:

- **Theme choice.** Whether an element actually goes edge to edge (and when) is decided
  by the component today. Making it a theme decision needs a meaning marker plus a way
  for rules to depend on width.

### Scroll areas and pinned elements

```text
sl-scroll-x    horizontal scroll area
sl-scroll-y    vertical scroll area
sl-pin-top     stays at the top edge of its scroll area while content scrolls under it
sl-pin-right   …right edge
sl-pin-bottom  …bottom edge
sl-pin-left    …left edge
sl-scroll-frame  box around one scroll area; its edges can carry overlays outside the clip
```

**Component author:** use `sl-scroll-x` / `sl-scroll-y` instead of writing overflow CSS,
and bind the `useScrollOverflow` composable's state as `sf-is-overflow-*` on the same
element. Use `sl-pin-*` instead of writing sticky CSS; add `sf-boundary-*` if the pinned
element has a separator. Nothing else — no classes for how hidden content is shown.
`sl-scroll-x` on an `sl-cluster` keeps it to one line and its items at their natural
width: scrolling replaces wrapping and squeezing. A swipe that reaches the end stops there
rather than scrolling the page.

Wrap the scroll area in `sl-scroll-frame` when its edges should be able to show more than
the fade — the theme's indicators, or your own edge controls positioned on the frame. The
frame is optional; an unframed scroll area gets only what the theme does to it directly.

**Theme author:** four situations to style:

- _A scroll area has hidden content on a side_ — `sf-is-overflow-*` (default: edge fade).
- _Content is passing under a pinned element_ — `sl-pin-*` inside `sf-is-overflow-*` on
  the same side (default: opaque surface + shadow cast onto the content).
- _An edge holds a pinned element_ — `sf-is-overflow-*:has(.sl-pin-*)`. A theme that fades
  edges should drop the fade there, or it covers the pinned element.
- _A framed scroll area has hidden content on a side_ —
  `sl-scroll-frame:has(> .sf-is-overflow-*)`, drawn with the frame's own `::before` /
  `::after` (default: an arrow on that edge, dropped where the edge holds a pinned
  element). The fade is a mask on the scroll area, so anything drawn inside it fades too.

**Keep the box and the scroll area apart.** Chrome (`sf-depth-*`) styles a box;
`sl-scroll-*` + `sf-is-overflow-*` style the content scrolling inside one. Put them on
separate elements — card outside, scroll area inside. On one element, whatever the theme
does to scrolling content also lands on the box itself, and the component cannot know
what that is.

**Layout guarantee:** an edge of `sl-scroll-*` that holds a pinned element has no padding.
Pinned means flush to that edge — padding there would leave a strip where content scrolls
past beside the pinned element. Other edges keep their padding.

**Caveat — nested scroll areas.** "Inside" and `:has()` look at any depth, so a scroll
area nested inside another reacts to the outer area's state too: its pinned elements can
pick up the outer area's treatment, and the outer area can drop an edge fade (and edge
padding) because of a pinned element that belongs to the inner one. Rare, and only ever a stray shadow or a
missing fade. Theme authors cannot scope it away.

**Possible fixes (not yet done):**

- _Composable reports pinned edges_ — works in today's browsers. `useScrollOverflow`
  already runs on every scroll area; it can find the pinned elements whose nearest scroll
  area is its own element and report `sf-is-pinned-*` facts on the scroll area alongside
  `sf-is-overflow-*`. Fade and padding rules then compound two classes on one element
  (no `:has()`), and the pinned-element treatment reads a bridge variable that every
  `sl-scroll-*` resets, so the nearest scroll area always wins. Authors bind one class
  object from the composable instead of listing classes. Trade-off: the flush pinned edge
  waits for JS, so a small layout shift on load.
- _CSS scroll-state container queries_ (`container-type: scroll-state`,
  `@container scroll-state(scrollable: right)`) resolve against the nearest scroll area
  natively, removing the caveat and the JS composable. Chrome/Edge only as of 2026-09;
  switch once Safari and Firefox ship it. Needs `@container` support in the generator.

### Placing a box over another

`sl-over` puts a box over the box it's in, out of the flow. Placing is layout, not the theme's
(owner, 2026-11-22). The align words say where, and a side with no word is filled: alone it
covers the box, `sl-align-y-end` alone is a bar along its foot, and both words put it on a
corner.

- It sits against the box it's in. The fixed CSS positions that box in the lowest layer, so any
  rule that positions it wins; not a popover or dialog, which the browser places itself. It
  isn't spaced or counted as a block.
- It's drawn over the boxes around it, so a mark's poke-out shows whole in a list with no gap,
  and under a pinned edge (`sl-pin-*`), which is drawn over all that scrolls under it.
- A mark goes in a plain box with what it marks, as `SfBadge` does:
  `<div><layout-card>…</layout-card><div class="sf-badge sl-over sl-align-x-end sl-align-y-start sf-is-overlay"></div></div>`.
  Straight in a component block, it gets a warning instead of code that handles it.
- It wears `sf-is-overlay`. Only a floating mark or count lets clicks through.
- The theme draws it, and sets how far a floating mark pokes out (a margin on the mark), as that
  goes with the mark's size; where it sits is whoever places it (owner, 2026-11-27).
- To move a placed mark from where its words put it, use `translate`: it adds to the theme's
  margin and the placing, at any spot, centred too. A margin of your own loses to the theme's,
  whose layers come after a component's.
- Nothing keeps room round a box for a poke-out. A mark comes and goes, so room made only while
  it shows would move what's beside it, and room kept always would space boxes for a mark they
  mostly don't have (owner, 2026-11-27).
  Where a box cuts it off (a scroll area, the top of the screen), give the mark room there or
  put it somewhere else.
- Limits: write a mark after a layer in the same box, as two are drawn in the order written. A
  box that clips cuts off the poke-out. A layer stops clicks on what's under it. A picture
  keeps its own size, so it suits a corner. `translate` sideways isn't turned round in
  right-to-left text.

### Theme contract

Themes can influence layout **metrics** via the tokens layout primitives read — gap,
padding, max-width, minimum column width, and the page margin (`--sf-spacing_page`).
Authors set these through `sf-` utility classes (`sf-gap-md`, `sf-padding-lg`); themes
decide what each scale step resolves to. Chrome padding must go through `--sf-padding`
(see Size), since insets read it.

Themes cannot change layout **behaviour**. `sl-columns` is always a grid. `sl-split` is
always fixed-plus-flexible. No theme can make `sl-stack` horizontal.

### Container-responsive collapse

Collapse responds to the space around a layout, not the screen width.

```text
sl-collapse-xs   collapse below xs breakpoint
sl-collapse-sm   collapse below sm breakpoint
sl-collapse-md   collapse below md breakpoint
```

The same widths swap what shows. `sl-hide-below-*` hides an element at or below the width;
`sl-show-below-*` shows it only then. Pair them to put a menu button in place of a row of
links.

```text
sl-hide-below-xs   sl-show-below-xs
sl-hide-below-sm   sl-show-below-sm
sl-hide-below-md   sl-show-below-md
```

**What is measured.** A box can't measure itself, so it measures the nearest width container
around it. A width container takes no width from its content, so only these boxes become one:

- **A layout around it**: a layout holding a collapsing element becomes a width container.
  So a block that collapses measures the nearest layout around it, whether it's a layout
  block (Columns) or classes typed on an element. A layout straight in a column of a split,
  Columns or a grid measures the whole layout around it: Columns in a split's narrow side stack
  only when the whole split is narrow. To stack by the column's width, put it in an `sl-stack` in
  that column. Straight in an inset, a layout measures the inset's margins too, so it stacks late
  by their width.
- **The document** (the editor and published pages) is always a width container, so a layout
  at the top of a page measures the page.
- **A layout that bleeds out of a document** (a top-level block set to bleed in an inset) is
  wider than the document, so it measures the box it bleeds into instead. A block that bleeds
  becomes a width container when it holds a collapsing element, so what's inside measures it.

**Nothing in a spot sized by its content measures** (in a document). A width container there
would be 0 wide. These spots are table cells, a cluster's items, a cover's items, anything in
a layout aligned sideways (`sl-align-x-*`), and the first column of a split with no column
widths set. Nothing in them becomes a width container; what they hold measures the next box
out. Only these spots are known: one made by a block's own style or a component's CSS (a flex
row, `fit-content`) isn't, so a layout in it that holds a collapsing block is 0 wide. App
screens leave this out because their popovers and menus sit inside rows, so a
component there keeps collapsing content out of such spots; the one they know is a menu straight
in a popover (below).

**A popover is laid out on its own.** What's inside one doesn't make the layouts around it
measure, so a toolbar holding a closed panel keeps its width. Inside the popover, layouts
measure as usual, except a menu straight in it: a menu is as wide as its items, so it never
measures, and what it holds measures the next box out (the editor's "⋮" shows Code view by its
bar's width). Anything else straight in it measures as usual: the block settings panel, with a
width of its own, puts its names above their fields by that width. A menu that should measure a
width of its own goes in a box in the popover, with the width on either: no longer straight in
it, the menu measures like any layout (owner, 2026-11-22).

**A placed box aligned sideways never measures** (`sl-over` with `sl-align-x-*`): it's as wide
as its content, so it would be 0 wide. One held to both sides measures as usual.

**In a document, hide and show measure the page.** "Hide below md" means the page is
narrower than md, wherever the element sits, so the layouts around it don't become width
containers for it. On app screens they measure the nearest layout around them; with none, the
element always shows.

**A hidden block leaves nothing behind.** It keeps its place in the page, but block spacing and
divide lines count only the blocks shown at this width, so hiding a box's first or last block
leaves no space or line at that edge. The widths split a box's width into bands, each listing
the classes hidden in it (`widthBands` in `slLayout.ts`); hiding, block spacing and a theme's
"after another block" are all written once per band from that one list, so they agree. The
bands need the widths in order, so all the widths are in one unit (any unit); a width in
another is refused where it's saved. Each block looks back past hide/show blocks for a shown
one, so a long unbroken run of side-by-side blocks that each hide or show (hundreds, such as a
desktop and a mobile version of every paragraph) is slow to restyle. Blocks that hide together
go in one box, and the box hides: that costs nothing.

**Nothing else is a width container.** Chrome boxes (a card, a toolbar) aren't: one sized by
its content would be 0 wide. A component with width rules of its own follows the component
rules (Editor integration).

The CSS is generated from the theme's breakpoints (the collapse layer in `generateCss.ts`);
the lists it reads are in `shared/layouts.ts` (`COLLAPSE_HOSTS`, `COLLAPSE_PREFIX`,
`COLLAPSING_LAYOUTS`, `COLUMN_LAYOUTS`, `HIDE_PREFIX`, `SHOW_PREFIX`) and `slLayout.ts` (`SIZED_BY_CONTENT_SELECTOR`,
`widthBands`).

---

## Themes

A theme is a set of token values plus optional class definition overrides, scoped by an
activation class on the element it themes or an ancestor (typically `<html>`).

```css
/* token settings — no layer needed (custom properties cascade per-property) */
.theme-editorial {
	--sf-primary: 30 64 175;
	--sf-primary_ink: var(--sf-primary);
}

/* class overrides — must live in the matching layer, scoped to the theme */
@layer sf-bundle {
	@scope (.theme-editorial) {
		.sf-depth-1 {
			box-shadow: none;
			border-left: 4px solid rgb(var(--sf-primary));
		}
	}
}
```

The expected case is a complete theme. A sparse theme works too, falling back to root
values for anything it doesn't override; the root theme is always active.

Storage and generation are application concerns.

---

## Naming convention

| Class                           | Kind     | Example                          | Meaning                                            |
| ------------------------------- | -------- | -------------------------------- | -------------------------------------------------- |
| `sf-{family}-*`                 | Bundle   | `sf-depth-1`, `sf-heading-2`     | Multi-property bundle                              |
| `sf-variant-*`                  | Variant  | `sf-variant-featured`            | Bundle modifier expressing intent                  |
| `sf-on-*`                       | State    | `sf-on-hover`                    | Interaction modifier                               |
| `sf-is-*`                       | Context  | `sf-is-overflow-right`           | JS-detected or author-declared condition           |
| `sf-*_*` (underscore)           | Semantic | `sf-fg_primary`                  | One property, mirrors a composite token name       |
| `sf-*-*` (hyphen, scale step)   | Utility  | `sf-text-xl`                     | One property, explicit scale step                  |
| `sf-boundary-*` / `sf-divide-*` | Bundle   | `sf-boundary-top`, `sf-divide-y` | Separation intent on own sides or between children |
| `sl-*`                          | Layout   | `sl-columns`                     | Structural arrangement                             |

---

## Editor integration

The editor exposes the content-author surface — picker controls translate to `sf-` and
`sl-` classes on `node.attrs.class`. Component-author and theme-author surfaces live
outside the editor.

**The editor's screen** (owner, 2026-11-20) is full screen, as page editors' are (WordPress's
since 5.4, Squarespace, Webflow): the site's header and footer go (the route's `editor` meta),
and its top bar has two rows at every width, so each control has one place a phone and a desktop
share. The page's row holds Exit, the name, the warnings, Save, Code view and "⋮"; the node path
has the second row to itself, as wide as the screen. Exit opens the page the editor was opened
from, as a link does, so the Leave question always applies; with none, home. Save says how the
page stands in words ("Save", "Saving…", "Saved") and shows only to whoever could save. The
editors scroll the line being written clear of the bar (`scrollClearOfEditorTopBar.ts`).

The path's row is depth 2: it's the row the page's Cards (depth 1) scroll under, so it's a layer
above them. The page's row meets only the path's, so it's depth 1, and the two rows look apart
(owner, 2026-11-21).

Exit is an arrow back, not ✕, which reads as closing and throwing away (owner, 2026-11-21). Where
the page's row is narrow (`xs`, a phone), the warnings and Code view go into "⋮", as the site's
nav puts its links in a menu, so the name keeps its room in any theme; "⋮" then wears a mark
(`SfBadge`). The badge is the mark's own component, not the menu's, so anything can wear one
(owner, 2026-11-21). The mark is a dot in the warnings' colour, as apps mark a "⋮" with something
in it; the number is the menu's first item. A count from two figures grew back over the narrow
dots (owner, 2026-11-27). The dot sits on the top end corner, so the page's row is a size up
(`sf-size-xs`, the path's `sf-size-2xs`): its padding gives the dot room under the top of the
screen, as the theme's own padding beats any the bar could add (owner, 2026-11-27).

Changes not yet saved show as a mark on the page's name, as editors mark an edited document by its
name; Save keeps one quiet look and says how the page stands in words ("Save", "Saving…",
"Saved"), which screen readers hear. A filled Save wasn't wanted as the sign, and a coloured
mark could read as "saved". The name's box is as wide as the name, and the mark follows it on
its line, centred, a gap after the box, as editors put an unsaved dot after a file's name; on the
box's corner it sat on the box's edge (owner, 2026-11-27). Cmd+S (Ctrl+S) saves too, from
anywhere in the editor; Save stays in the bar for touch screens
(owner, 2026-11-22).

Picker choices land in storage by a uniform pattern:

- **Palette pick** → class pair on `node.attrs.class` (`sf-bg-primary-5` + `sf-bg-alpha-3`,
  same shape for `sf-color-*`, `sf-border-*`, `sf-shadow-color-*`); text's colour is one of its
  looks, written as the same classes (Text's looks). Stays in the cascade layer system; state
  classes and compound rules can still intercept. Kept as the colour's names (Colours and alpha).
- **Shape/scale token pick** (`sf-shadow-md`, `sf-radius-2`, `sf-text-xl`) → single class
  on `node.attrs.class`; the utility rule composes with any accompanying runtime state
  vars.

No tool writes a value of its own into a block's style (`node.attrs.style`): one comes from a
paste or the code view, and is kept. It beats every layer, so state classes can't change it, nor
a theme. A tool's pick replaces the value it would override (Colours and alpha, Corners).

A tool changes a block's settings in place (`updateAttributesAt`), never by writing the block
anew, so a block selected whole stays selected and keeps its other settings; only a change of the
block's kind replaces it. A block inside a line (an icon, a span block) too. A lint rule keeps it
so (`client/eslint.config.js`).

**Text's looks** (a colour and its step, a font, size, line height, letter spacing) are one mark,
TipTap's text style (`textStyleMark.ts`): a setting for each look, holding its slot's name
(`danger`, `2`), written as its class, and `style`, a look written as a value (`color: red`). With
a mark per look, the first to read a span kept only its own looks: a colour and a font lost the
font. The page writes one span of looks per piece of text: serif text with one red word is three
spans side by side.

Formatting and a span block are both written as `<span>`, so the page tells them apart as it
reads one, by one rule (`isTextLooks`, `shared/textLooks.ts`; owner, 2026-11-15): **everything on
the span is a look, with at least one: formatting. Anything else on it: a span block**, keeping
all of it. A look is one of the theme's fixed slots as a class, not a prefix (`sf-text-block` isn't
a size), or a property the looks set in its style (`color`, `font-family`, `font-size`,
`line-height`, `letter-spacing`); a step only beside a colour class. An id, another class or any
other style property makes a span block. Classes and style are treated alike, and no marker tells
them apart: the page would carry it only for the editor, and a paste never would. Neither keeps
other attributes (`title`, `data-*`); the code view refuses them. So a span block holding only
looks reads back as formatted text, looking the same; to stay a block it needs a class or id of
its own. Text pasted from another page or app always carries more than looks in its style, so
each run is a span block (owner, 2026-11-19: accepted; Enter inside one does nothing, and bold in
its style is taken off in the code view or the Attributes panel).

The editor reads only the page's own form and converts nothing, as converting means copying the
browser's reading of CSS (owner, 2026-11-15). Other sources' forms are for a converter at the
paste (`sf-system-todo.md`, "A converter for pasted HTML").

- **Looks inside looks** aren't read as one. ProseMirror's reading stands: a mark that excludes
  another (looks inside looks, inline code) replaces it for its words, with bold or a link between
  too. The code view's check doesn't predict this: it asks whether a mark's words all came out
  inside what was written for it, and refuses one whose didn't, saying what to write: "… Put the
  looks on one span.", "…: inline code takes no looks." or "…: inline code takes no other
  formatting." A span block between keeps both: ProseMirror puts the outer looks on the block.
  Read as one, they'd need CSS's order copied (an inner class beats an outer style).
- **A look on other formatting** (bold, inline code) isn't read: the page keeps one form, and the
  code view says where it goes: on a span around bold, and none on inline code (owner,
  2026-11-15). Text's looks are written
  outside bold (`<span class="sf-color-danger"><strong>`), TipTap's order.
- **A pick** sets only its own looks and keeps the others, taking the property each sets out of
  the style (`setTextLooks`): a theme colour picked over a pasted red shows, and a size picked
  keeps a pasted font.
- **A look of its own** (in a style, pasted or written in the code view) is kept and shows over
  the theme's, though it isn't one of them. `prefer-theme-text` points it out, as
  `prefer-theme-color` does a colour; a pick replaces it. `font` (a font, size and line height in
  one) isn't a property the looks set, so no pick takes it out: it's taken off in the code view
  (owner, 2026-11-20).
- **A copy's edges** (`copyAndPaste.ts`): a span block at an edge that the copy holds words of
  goes in whole, as part of bold text pastes bold; one it holds nothing of is left out. A click
  just after an icon puts the cursor inside it, at its end, and a copy from there held the icon
  empty.

Every kind of block can be selected whole, none is marked not selectable: Undo and Redo bring a
block selected whole back as one only if its kind is selectable, and the app selects every kind
whole (a frame click, a crumb, a drop).

Content renders through TipTap both in the editor and on published pages (a read-only
editor), so the same rules apply to both. The editor, the home page and the preview show it
in the page shell (`SfPageShell`), so a page is edited as it sits there. A collection's sheet
(`StackableSheet`) is an inset whose margin is its padding, so a page there sits on the
sheet's line and bleeds to its edges. How a document's blocks sit is fixed CSS served
with the theme (`api/src/domain/css/`), so it can read the one list of layouts that space
their items with a gap (`GAP_LAYOUTS` in `shared/layouts.ts`, which the validator reads too):

- **Elements** opt into the theme by wearing `sf`, set by the node: `blockquote.sf`,
  `code.sf`, `ul.sf`, `ol.sf`. The theme draws them; the reset leaves the rest bare. A block's
  own look is drawn, as a component's template draws its own, and is never one of its settings
  (`ownLook`): it isn't saved, copied or in the code view. Nor is what a block draws from its
  settings: a to-do item's tick box, a table's column list (drawn by their views), so its HTML
  holds each setting once. Inline code is written with its `sf`, as code has no settings for a
  paste to save it in. A heading wears its level's `sf-heading-*` unless it has one of its own.
- **Space between blocks** is `blockSpacing.ts`, in the lowest layer so a component rule that
  sets a block's space above it wins (themes set looks, not spacing). It belongs to flow
  containers — the document, a node view's content box, a plain div block, a quote, a list
  item, a task item's content, a table cell — where each block after a shown block gets the
  theme's `md` step above it (`xs` between list items); a block hidden at this width, or a
  placed box (`sl-over`), doesn't count. Space under a block merges with the next block's space above, the larger showing, so
  it can widen a gap but not narrow it. Layouts are the author's
  choice, not the default: an element wearing a layout class isn't a flow container, so
  its gap alone spaces its children.
- **Defaults the author can override** sit in the lowest layer, keyed on markers the node
  renders but never stores: a video fills its width at 16:9, up to 36rem unless it bleeds
  (`embeds.ts`), until an `sl-aspect-*` choice or its own style says otherwise. A video is one box, as an image is: its
  iframe wears its classes, so it bleeds, pins, hides and shows like any block
  (`youtubeExtension.ts`).
- **Component blocks** (blocks rendered by a Vue component, such as the layout blocks) are
  two boxes; the next section covers how rules reach through them.

### Component blocks

A block rendered by a Vue component (a TipTap node view) is two boxes, in the editor and on
published pages:

```text
component root                the block's box: wears the node's classes
  [data-node-view-content]    content box, rendered where the component puts <slot />
    the child blocks
```

The component's root is the block's box, as a plain block is one box: its parent places it,
and it wears TipTap's `data-node-view-wrapper` marker and the classes the editor adds while
you work (`sf-on-targeted` when it's selected or chosen with others, `sf-is-error` or
`sf-is-warning` for a warning).

**Rules are written for the content tree.** Theme rules and fixed `sl-` CSS are written as if
a block's child blocks were its children (`.sf-divide-y > * + *`, `.sl-inset > .sl-bleed`).
The generator rewrites each rule as it emits the stylesheet, so a child step also reaches the
blocks in a component's content box (`throughNodeViews` in
`api/src/domain/css/nodeViewSelectors.ts`, used through `forBlocks` in `slLayout.ts`):

- **A layout's content box steps aside** (`display: contents`, `nodeViews.ts`), so the blocks
  inside are the layout's own items. They follow the component's own parts as siblings: in a
  divided layout with a heading of its own, the first block gets a line.
- **"After any block" means after a shown block.** A step from any block to a later one
  (`* + X`, `* ~ X`) is also written once per width band, after a block shown there, so a
  block hidden at this width isn't counted (Container-responsive collapse). A placed box
  (`sl-over`) isn't counted either, before or after. Only "any block"
  can be: in `h2 + p` a block hidden between the two still counts, as CSS can't say "the
  nearest shown block before it is a heading".
- Rewritten rules keep their weight.
- **What can't be rewritten:** a `:has()` inside another `:has()` (the browser would drop the
  whole rule), a child or sibling step inside `:not()`, `:is()` or `:where()`, and a sibling
  step straight inside `:has()`. A theme rule like that is emitted as written, with a
  warning, and misses component blocks; fixed CSS like that throws as soon as the code loads.

Which boxes measure width for collapse is under Container-responsive collapse.

**Writing a component block** (component author). Content authors put blocks in your
component, so these keep the system's layout working around and inside it:

- **Render one root element and let attributes fall through** (Vue's default, no
  `inheritAttrs: false`). The root is then the block's box: it wears the node's classes and
  TipTap's marker, without which the block doesn't show.
- **Don't declare `click`, `pointerdown`, `mousedown`, `copy`, `cut` or `paste` as your
  component's own events** (`emits`). The editor listens for them on your root; declared, they
  reach your component instead, and selecting the block by clicking, locking its own parts,
  and copy and paste stop working.
- **Keep your CSS in a cascade layer** (`@layer ui`, as the app's components do). Where your
  block sits (hide, show, pin, bleed) is set on your root in the layout layer, which beats
  `ui` but loses to CSS outside any layer.
- **Put `<slot />` directly in the root** when the blocks should be your layout's items.
  Anything in between makes them that box's items instead.
- **Don't give the root a height of its own to fill a row** (`height: 100%`). In a row it
  stretches already; a height of your own fills the row even when the page builder aligns the
  row's blocks to the top or middle (measured in Chrome and WebKit, 2026-11-11).
- **Avoid width containers of your own.** A width container takes no width from its content,
  so your block is 0 wide wherever its width comes from its content (a cluster, a table
  cell). If you need one, name it and query it by name
  (`container: my-card / inline-size`, `@container my-card (…)`). A name doesn't stop the
  system's queries from finding it; it makes sure yours find it.
- **Don't size the slot by its content in your own CSS** (a flex row, `fit-content`): a
  collapsing block inside it would be 0 wide. Use `sl-` classes for that; the system knows
  their content-sized spots.
- **Prefer `overflow: clip` to `overflow: hidden`.** `hidden` makes the box a scroll area,
  so a pinned block inside stops sticking.
- **Put a layout of your own around a collapsing layout in your component** (a Stack will do),
  or give your root one. A collapsing layout measures the nearest layout around it (Stack,
  Cluster, Columns, Split, Centre, inset or grid); with none of yours, it measures the page
  around your block, so where the block is placed changes when it stacks. Measured, 2026-11-10:
  Columns in a box with no layout, in one side of a Split, stacked when the whole Split was
  640px (their side 312px); with a Stack around them, when their side was.

---

## Validator and linter

Rules the system relies on that nothing else checks: the editor runs those that can break on a
page; the IDE linter and a theme's save, the rest (later). Each has a name and warns in plain
terms; its reason is in the section it names, so it's written once.

**The shape.** One core holds the rules that read elements and CSS: those in, results out. It
knows nothing of where they came from, so each place that checks reads what it has into them
and shows the results its own way. A component's code rules read Vue's script, so they're the
IDE linter's own.

- **Elements** are hast, HTML's syntax tree as unified's tools (rehype, MDX) have it: its tags,
  classes, ids, attributes and children. A block's element also wears the classes the block
  always wears, which the page doesn't save: a built-in block's own look (a to-do item's
  `sl-split`), or the classes a component draws on its root (the Centre's `sl-center sl-stack`).
  Never what the editor shows only while you work (`sf-on-targeted`, `sf-is-error`,
  `sf-is-warning`). The editor reads a
  component's from its drawn root, the one thing it reads from the page as drawn; the IDE linter
  from its file, where a class set by a setting is only one that may be set.
- **CSS** is CSSTree's tree, which ESLint's CSS language reads: declarations, values and
  selectors, each with its place in the text. A block's own style, a theme's rules and a
  component's styles reach them alike; the core reads a block's style itself (`readStyle`), so
  every place reads it one way.
- **A result** is one rule broken: the rule's name, its type (ESLint's: a problem, or a
  suggestion that only points out the usual way), its message and what's involved. The name is
  the rule's entry below, which names the section that gives the reason, as ESLint plugins make
  a rule's docs link from its name. What's involved is the nodes themselves, the same objects
  the rule was given (elements, or CSS's declarations and values), so each place that checks
  finds them its own way: a block's position in the editor, a line in a file.

It takes ESLint's shape, not ESLint: ESLint reads only text, so the editor's blocks would go
through code and back, and the editor would carry ESLint. No HTML linter fits as the core
either: html-validate also reads only text. The elements and the CSS are standard trees, not
ones of our own, as ESLint's own languages each read their language's (Markdown's, CSS's): their
readers, walkers and types come with them.

**Where a rule shows:** wherever its problem can happen.

- **The editor** runs every rule that can break on a page, on its blocks, their own style and
  the styles their text and inline blocks are written with, after each change. A block a rule
  names wears `sf-is-error` for a problem or `sf-is-warning` for a suggestion, and a selected
  block wears `sf-on-targeted`, so the theme draws both (the root theme: the block's line in
  the error or warning colour, dashed or dotted, thick while targeted; Line parts). The editor
  draws no look of its own:
  every theme can make its warnings fit. Its Attributes panel lists why, above the rows
  where most are fixed, with the classes the block wears by itself, which no row shows, so a
  warning appears or goes as the class row's change applies. The node path shows the blocks
  around the cursor that have one, and the top bar's count goes to the next. The Attributes
  button, the path's crumbs and the count each take the colour of the warnings they point to, as
  a block's line does: the error colour where a problem is among them, the warning colour for
  suggestions alone. Warnings are for
  the person editing: a save never waits for them or stops on them, and nothing checks a page
  on the server when it's saved.
- **An IDE linter** (later) checks pages, screens and components written in files, with every
  rule that can break there. It's a thin ESLint plugin: its element and CSS rules call the core,
  ESLint's Vue and HTML parsers read the code, and ESLint shows the results and holds the
  settings. The component store runs it when a component is added. It checks code, so nothing
  checks the page as drawn.
- **A theme's save** (later, once there's a theme editor) checks its rules with the rules that
  read CSS, and refuses a selector outside the closed set (`valid-selector-shape`). A candidate:
  a fill's background or a tint's border set directly instead of through its part, as a
  context would then change that fill ("Fill parts").

**Rules that read elements** (a page's blocks; pages, screens and components in files)

- **`no-duplicate-id`**: two elements with one id ("two blocks share the id …"): a link to it
  goes to the first.
- **`one-arrangement-per-box`**: a box with two arrangements, a component block's own included
  (Layout primitives, "One arrangement per box").
- **`no-bleeding-center`**: `sl-center` with `sl-bleed`, a Centre block included. A centred
  reading column that also spans edge to edge has no clear meaning. For a band holding a
  centred column, set a Card or a Stack to bleed and put a Centre in it (Side margins and
  full-bleed).
- **`no-collapse-straight-in-columns`**: a collapsing layout straight in a column of a split,
  Columns or a grid: it measures the whole layout, so it stacks only when that is narrow. To
  stack by the column's width, put it in an `sl-stack` in that column (Container-responsive
  collapse). An inset is left out: a layout straight in one stacks late only by the inset's two
  margins (48px with a 24px page margin), and bands holding Columns are common.
- **`no-over-with-placement`**: `sl-over` with `sl-pin-*`, `sl-bleed`, `sl-center` or `sl-row`,
  which place the box too, so one loses (Placing a box over another).
- **`no-over-in-component`**: `sl-over` straight in a component block, where it sits on the
  wrong box (Placing a box over another).
- **`require-picture-size`**: a picture with no size of its own (Layout primitives, "A
  picture's space before it loads").
- **`valid-heading-class`**: an `sf-heading-*` class on a block that isn't a heading, as the
  line Enter makes after a heading with one of its own gets, or two on one heading: body text
  takes its weight from a utility, not a heading's bundle, and a heading has one prominence
  (Vocabulary governance).
- **`prefer-center-around-video`** (a suggestion): `sl-center` on a video. A Centre holding the
  video (the video's own style `max-width: none`) lays out the same; both work, it only points out the usual
  way.
- **`prefer-overlay-on-over`** (a suggestion): `sl-over` without `sf-is-overlay` (Placing a box
  over another).
- **`max-hide-show-run`** (a suggestion): 100 or more side-by-side blocks in a row that each
  hide or show by width: put the blocks that hide together in one box and hide the box
  (Container-responsive collapse).
- **`no-hide-show-without-layout`**: `sl-hide-below-*` or `sl-show-below-*` on an app screen
  with no layout around it: it never hides, and the rules for shown blocks can't tell, so a
  divide line after it is lost. In a page they measure the page wherever the block sits, so this
  is for screens only (Container-responsive collapse).

**Rules that read CSS**, each naming whose: a theme's rules, a component's styles or a block's
own style.

- **`no-layout-on-sl-classes`** (a theme's rules): a rule that sets layout on an `sl-` class.
  Themes set looks only (sl- layout subsystem).
- **`valid-selector-shape`** (a theme's rules): a selector outside a closed set of shapes, as
  selectors are free text today. The shapes that can't reach through component blocks are
  outside it (Component blocks).
- **`no-after-particular-block`** (a theme's rules): a rule that picks a block right after a
  particular one (`h2 + p`): a block hidden between them still counts, and a theme author can't
  know where pages hide blocks. "After any block" (`* + *`) counts only shown blocks (Component
  blocks).
- **`no-container-units`** (any CSS): container units (`cqw`, `cqi`) in a value: what they
  measure depends on where the system puts width containers (Container-responsive collapse).
- **`require-channel-fallback`** (any CSS): `var(--sf-gap)` or `var(--sf-padding)` with no
  fallback in a larger value (`calc(var(--sf-padding) + 1rem)`, `var(--sf-gap) 1rem`): unset,
  the whole value is dropped, not just its part. As the whole value, unset means none, which is
  what a reader with no default means (Layout channels).
- **`no-width-container`** (any CSS): a width container (`container-type`, or the `container`
  shorthand), or the size containment one has (`contain: size`, `inline-size` or `strict`). It
  takes no width from its content, so it's 0 wide wherever its width comes from its content,
  such as in a cluster (Component blocks, "Writing a component block").
- **`no-overflow-hidden`** (any CSS, on a box that can hold blocks: a theme's rules, a
  component's box around its slot, a block's own style): `overflow: hidden` makes the box a
  scroll area, so a pinned block inside stops sticking; `overflow: clip` clips without that
  (Component blocks, "Writing a component block").
- **`no-content-sized-box`** (any CSS, on a box that can hold blocks: a theme's rules, a
  component's box around its slot, a block's own style): a box that sizes what's inside by its
  content: a flex row; a box that takes its content's width (an inline or table display, a
  float, or `position: absolute` or `fixed`, with no width of its own; a width of
  `fit-content`, `max-content` or `min-content`); items aligned instead of stretched; or grid
  columns sized by their content.
  The system doesn't know the spot, so a layout in it that holds a collapsing block is 0 wide
  (Container-responsive collapse).
- **`prefer-theme-color`** (a suggestion; a block's own style, and the styles its text and
  inline blocks are written with): a fixed colour, in any property: a hex, a colour function
  holding no variable, or a named colour, as CSS's grammar for the property reads it (not
  `transparent` or `currentColor`). It doesn't change with the theme (Colours and alpha). A
  value holding a variable, or a word for every property (`inherit`), is left out, by every
  `prefer-theme-*` rule alike (`validator/ownValue.ts`).
- **`prefer-theme-radius`** (a suggestion; where `prefer-theme-color` looks): a corner size other
  than 0 on any corner property. It doesn't change with the theme (Corners). Square is square in
  every theme, so 0 is left out; a value holding a variable may be the theme's size.
- **`prefer-theme-text`** (a suggestion; where `prefer-theme-color` looks): a font, size, line
  height or letter spacing of its own, or a `font`. It isn't one of the theme's (Editor
  integration, "A look of its own"): a size in `em` grows with the theme's, but is pointed out
  too. Its properties are the looks' (`shared/textLooks.ts`), so a new look is checked too.
- **`require-container-name`** (a component's styles): an `@container` query without a name
  (Component blocks, "Writing a component block").
- **`no-root-height`** (a component's styles): a height on the component's root (`height`,
  `block-size`): it fills a row however the page builder aligns the row's blocks (Component
  blocks, "Writing a component block").
- **`require-cascade-layer`** (a component's styles): CSS outside a cascade layer (Component
  blocks, "Writing a component block").

**Rules that read a component's code** (Component blocks, "Writing a component block")

- **`one-root-element`**: more than one root element, or `inheritAttrs: false`, so the root
  doesn't wear the node's classes.
- **`require-slot-in-root`**: `<slot />` that isn't a direct child of the root.
- **`no-editor-events-in-emits`**: `click`, `pointerdown`, `mousedown`, `copy`, `cut` or
  `paste` in `emits`.
- **`no-collapse-measuring-outside`**: a collapsing layout in a component with no layout of
  the component's own around it, so it measures the page around the block. A component is
  checked inside once, when it's made or added; a page reads only its root.

---

## How this differs from other approaches

- **Tailwind** — scale values without meaning. No surface depth, no semantic intent, no
  theming through content.
- **Open Props** — design tokens as CSS custom properties without a class vocabulary on
  top. sf/sl uses similar tokens but adds the class contract that lets content carry
  styling intent.
- **BEM** — semantic class names with hardcoded values; CSS custom properties make the
  old pattern viable.
- **PrimeVue / shadcn / Material Design** — token vocabularies bound to fixed component
  sets; outside components can't participate.
- **Every Layout / CUBE CSS** — methodological influence. `sl-` borrows from Every
  Layout; CUBE leaves the token and class layering to be specified.
- **Portable Text / ProseMirror** — document formats for content. This is the equivalent
  for styling intent: a schema with themes as renderers.

Three things together, none alone unique: content that carries styling intent, three
actors (theme, component, content) decoupled through a shared vocabulary, and a
vocabulary small enough to be a stable contract.
