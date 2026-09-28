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
| `reset`       | Static resets (Tailwind preflight, table-cell margins) — lowest                              |
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
`sf-depth-1` card. Each class carries an order number (default 0) that settles these
ties; modifiers such as `sf-size-*`, `sl-align-*` and `sl-inset-line` carry a higher
one. The number only breaks ties — it never crosses layers and never beats a more
specific combination of classes. It belongs to the vocabulary, so themes can't change
it.

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

Four kinds of CSS custom properties appear across the system. They look alike but play
different roles. The prefix rule:

> `--sf-*` — a value an author could reasonably write inline.
> `--sfx-*` — only rules write this; internal rule-to-rule contract.

| Kind             | Example                                     | Set by                                                          | Read by                            |
| ---------------- | ------------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| Theme token      | `--sf-primary-5`, `--sf-fg_primary`         | Theme class (`.theme-x { --sf-X: ... }`)                        | Rules across every layer           |
| Composition slot | `--sf-bg-alpha`, `--sf-shadow-color`        | Utility class (with reset); inline as escape hatch              | Carrier class in the same family   |
| Layout channel   | `--sf-gap`, `--sf-padding`                  | `sf-gap-*` / `sf-padding-*`; reset to `0` per node-view-wrapper | `sl-*` primitive at inner selector |
| Bridge           | `--sfx-surface-color`, `--sfx-inset-margin` | Bundle rule (or layout rule, for `--sfx-inset-margin`)          | Higher-layer rule / descendants    |

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
is a composition slot (not a bridge), inline `style="--sf-shadow-color: ..."` beats every
layer and is the escape hatch for freeform shadow colours.

### Layout channels

Cross the `sf-` / `sl-` subsystem boundary. `sf-gap-md` sets `--sf-gap` on the wrapper;
`sl-stack`'s inner content selector reads it. Every `[data-node-view-wrapper]` resets
`--sf-gap` and `--sf-padding` to `0` — this prevents a parent layout primitive's spacing
from cascading into a nested primitive that has no channel class of its own.

Channels look like tokens because they share the `--sf-*` prefix, but they are runtime
slots filled by utility classes, not theme values. A theme cannot meaningfully set
`--sf-gap` in a theme class — the per-wrapper reset overwrites it at every node-view
boundary.

Component-internal layout (gap between icon and label inside a button, controls inside
a picker) uses the channel with a scale-step default: `gap: var(--sf-gap, var(--sf-spacing-xs))`.
This keeps the gap open to override via `sf-gap-*` while setting a sensible component-level
fallback. The raw scale step alone (`var(--sf-spacing-xs)`) is not the pattern — it bypasses
the channel and closes off per-element override.

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
**not** reset at node-view wrappers — lining up with the nearest inset is the point. With
no inset above, readers fall back to the page margin.

The alternative — hardcoding the underlying token (`var(--sf-radius-2)`) or writing
per-bundle compound rules — couples the consumer to the current theme's choice and
breaks under any theme that expresses the bundle differently. (The inset compounds are
per-bundle only in naming which classes own padding; the value comes from the padding
contract, not a hard-coded token.)

---

## Tokens

Tokens are CSS custom properties — the raw values everything else draws from. All system
tokens are prefixed `--sf-`. Two kinds, distinguished by separator:

**Range tokens** (hyphen): a fixed scale of slots.

```
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

```
--sf-fg_primary      default foreground
--sf-fg_inverted     foreground on brand/inverse surfaces
--sf-primary         brand colour
--sf-danger          danger colour role (sf-variant-danger)
--sf-warning         warning colour role (sf-variant-warning)
--sf-success         success colour role (sf-variant-success)
--sf-info            info colour role (sf-variant-info)
--sf-fg_on_primary   text on a solid primary fill (loud primary/featured, a switch knob)
--sf-fg_on_danger    text on a solid danger fill
--sf-fg_on_warning   text on a solid warning fill
--sf-fg_on_success   text on a solid success fill
--sf-fg_on_info      text on a solid info fill
--sf-border_color    border colour
--sf-shadow          shadow colour
--sf-spacing_page    page margin: room between the screen's side edges and content
```

A theme changes the value; every reference picks it up.

`fg_on_*` follow the fill, not light or dark mode: a theme picks the text for its red,
amber and so on once, whichever mode is on. `fg_inverted` is for neutral fills (a fill
in the text colour), where flipping with the mode is right. A theme that changes a colour
role sets its `fg_on_*` to match.

### Colours and alpha

Colours are stored as RGB triplets — three space-separated values, no `rgb()` wrapper:

```css
--sf-primary-5: 16 185 129;
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
Freeform values (arbitrary hex, custom lengths) use inline `style` as the escape hatch
when no palette token fits.

### When a token belongs

Three rules:

**Used in more than one place.** A token earns its place only if its value is used in more
than one place. A token used in exactly one class is an indirection — replace it with the
primitive it points to.

- `--sf-shadow` ✓ — every shadow references it
- `--sf-card-radius` ✗ if it only appears in `.sf-card`; use `var(--sf-radius-2)` directly

**Aliases only for theme-level decisions.** A semantic alias over a scale step is
legitimate only when it represents a theme-level choice. `--sf-primary` = `--sf-primary-5`
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

```
sf-depth-0   canvas / page
sf-depth-1   cards, wells
sf-depth-2   dropdowns, popovers
sf-depth-3   modals
```

**Headings** — typographic prominence. h1–h6 encode document outline position; these
classes carry visual prominence, which does not always align — a deeply nested section's
h1 may need heading-2 treatment:

```
sf-heading-1   most prominent
sf-heading-2   secondary
sf-heading-3   tertiary
```

**Loudness** — attention hierarchy among sibling content blocks. Higher number = more
attention, consistent with the rest of the numbered scales in the system:

```
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

```
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

```
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
`sl-cluster` or `sl-columns`.

```
sf-divide-x    between horizontally arranged children
sf-divide-y    between vertically arranged children
```

New bundle families join this layer through the second-level admission test in
Vocabulary Governance.

### Element markers — `sf-element`

Class analog of a bare HTML element rule. HTML has some element categories baked in —
`<button>`, `<nav>`, `<table>`, `<mark>` — that themes decorate via bare element rules.
Real UI categories HTML forgot (chip, badge, tag) need class markers to give themes
something to decorate. Markers sit in their own cascade layer (`sf-element`, below
`sf-bundle`) so they behave the way HTML elements do — a baseline that bundles, variants
and states override predictably, without depending on source order to break ties.

```
sf-chip          compact discrete-unit chip — tag, filter, selection, status
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
sf-swatch        small colour-surface tile — palette chip, native colour input.
                 Theme decides border/radius/padding; consumers set width/height
sf-field         editable form-control chrome shared by input/select/textarea —
                 border, radius, font, padding-bridge, focus contract
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
a colour treatment specific to badges, whatever the category demands after the axes have
done their work.

**Markers stack additively over the underlying element.** `<button class="sf sf-chip">`
wears both — `button.sf` provides the button baseline; `sf-chip` adds tight leading;
`button.sf-chip` compound refines chip-specific properties (r-3 shape, tighter alpha
border). A theme that hasn't defined the compound still produces a working button — the
element rule is always the floor. Markers never replace the underlying identity; they
add and refine.

Elements without a baseline in the vocab (e.g. `<span>`) can still opt into a marker's
chrome via that marker's element compound alone — `<span class="sf-chip">` fires
`span.sf-chip` rules without any `sf` membership marker, because a span has no baseline
to admit. The element compound is the floor in that case.

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

```
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
A floating box (`sf-is-overlay`) keeps its loudness: the tint sits on a solid surface so
the page doesn't show through, and it keeps its depth's shadow (read through
`--sfx-depth-shadow`).

**Quiet is a shade of the text around it.** Quiet text, quiet icons and hover and press
tints are made from the text colour where they sit (`currentColor`), not from the theme's
`fg_primary`. So a quiet close button on a solid red box is a faded version of that box's
white text, and on a card a faded version of the card's text. Each box sets only its own
text colour: a solid fill its `fg_on_*`, a `sf-depth-*` surface the theme's `fg_primary`, so
a card inside a coloured box has normal text again. No rule redefines a theme token.
A marker with its own colour that is worn with a depth (`sf-drag-handle`) needs a compound
with that depth, since depth sits in the higher layer.

### Context — `sf-context`

Runtime conditions applied as classes — either by JavaScript measuring the DOM or by the
author declaring a known context. They reflect facts about the current state of the
environment, not authored intent.

```
sf-is-edge-top         element is flush with the top viewport edge
sf-is-edge-right       element is flush with the right viewport edge
sf-is-edge-bottom      element is flush with the bottom viewport edge
sf-is-edge-left        element is flush with the left viewport edge
sf-is-overflow-top     content is clipped at the top
sf-is-overflow-right   content is clipped at the right
sf-is-overflow-bottom  content is clipped at the bottom
sf-is-overflow-left    content is clipped at the left
sf-is-overlay          element is physically positioned over other content
sf-is-loading          element is in a loading / pending state; a busy button stays
                       enabled (aria-disabled) so it keeps focus
sf-is-sticky           a sticky element is currently in its pinned position
                       (sl-pin-* makes it sticky; this is the stuck state)
sf-is-error            element or field is in a validation / error state
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
chrome (background, border) since the parent already delineates, but a theme is
free to soften it differently — reduced padding, muted colour, no change at all.
Element-agnostic: applies equally to a `<button>` inside a card, a nested
card-shaped `<div>`, or anything else that would otherwise draw its own container.

`sf-flush` opts out of the chrome-class padding default — wear alongside `sf-depth-*`
when the child touches the container's inner edge (image cards, toolbar slots).
**Follow-up ([[project-sl-padding]]):** move padding to an `sl-pad-*` layout family
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

`sf-is-*` classes differ from `sf-on-*` in source and meaning:

|         | `sf-on-*`                              | `sf-is-*`                                                                 |
| ------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Set by  | Author intent                          | JavaScript measurement, or the author where the structure makes it a fact |
| Meaning | "this element should respond to hover" | "this condition is currently true"                                        |
| Example | `sf-on-hover`                          | `sf-is-overflow-right`                                                    |

Multiple `sf-is-*` classes may be present simultaneously and can be compounded in rules
— a rule requiring both `sf-is-overflow-left` and `sf-is-overflow-right` handles the
both-edges case at higher specificity than either alone.

### Semantic — `sf-semantic`

Single-property classes that bind one CSS property to a shared semantic token (underscore
naming, mirroring the token name).

```
sf-fg_primary    color:        rgb(var(--sf-fg_primary))
sf-border_color    border-color: rgb(var(--sf-border_color))
```

The author signals "this property should track a theme value"; the theme controls the
value.

### Utility — `sf-utility`

Single-property classes that bind one CSS property to a specific scale step (hyphen
naming, mirroring the token name).

```
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
spacing into the layout system without compromising layout's structural fixity.

In the editor context, every `[data-node-view-wrapper]` resets `--sf-gap` and
`--sf-padding` to `0`. This prevents a parent layout primitive's spacing from
cascading into a nested layout primitive that has no spacing class of its own —
the reset breaks CSS custom property inheritance at each node boundary.

`sf-shadow-*` uses `rgb(var(--sf-shadow) / var(--sf-shadow-opacity))` as its default
colour composition, both theme-controlled. Colour picks follow the same class-pair +
freeform-hex-escape-hatch pattern as bg/text/border: palette picks emit
`sf-shadow-color-*` + `sf-shadow-alpha-*` (in `sf-utility`); arbitrary hex picks emit
inline `style="--sf-shadow-color: ..."`. Same var name for both paths — inline still
beats layered classes so the escape hatch works cleanly on top of a palette pick.

### States — `sf-state`

Interaction modifiers. A bare rule applies everywhere the class appears; a compound
selector overrides it at higher specificity. Write one bare fallback, then only the
combinations that need a different treatment — the full depth × variant matrix does
not need to be specified explicitly.

```
sf-on-hover
sf-on-focus
sf-on-active
sf-on-selected
sf-on-disabled
sf-on-dragging   element is actively being dragged (JS-toggled, no CSS pseudo)
```

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

### Layout primitives

Nine structural patterns:

```
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

Alignment modifiers compose with any grid/flex primitive (default centre on `sl-cover`):

```
sl-align-y-start   top
sl-align-y-center  middle
sl-align-y-end     bottom
sl-align-x-start   left      (grid-based; flex containers ignore justify-items)
sl-align-x-end     right     (grid-based; flex containers ignore justify-items)
```

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
  room between the screen's side edges and content. Only the sides: top padding is the
  component's own spacing choice, since nothing lines up with it.
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

**Rules**

- **Nothing is assumed.** A plain inset only reads the margin; only boxes that set their
  own padding publish one. Outside an `sl-inset`, `sl-bleed` does nothing.
- **One arrangement per box.** `sl-inset` arranges its children, so it doesn't share an
  element with `sl-stack`, `sl-cluster`, `sl-columns`, `sl-split` or `sl-grid`. Add a
  wrapper if needed.
- **Direct children only.** Bleed reaches the nearest inset.
- **The page margin and page width are lengths**, not percentages — tracks and padding
  resolve percentages against different widths. `clamp()` and `vw` are fine.
- `sf-is-edge-*` only says a box touches the screen edge; the theme decides the look
  (default: square the touching corners). It adds no spacing.

Not yet covered:

- **Editor content.** Blocks sit inside node-view wrappers, so a block can't be a direct
  child of an inset yet.
- **Theme choice.** Whether an element actually goes edge to edge (and when) is decided
  by the component today. Making it a theme decision needs a meaning marker plus a way
  for rules to depend on width.

### Scroll areas and pinned elements

```
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

### Theme contract

Themes can influence layout **metrics** via the tokens layout primitives read — gap,
padding, max-width, minimum column width, and the page margin (`--sf-spacing_page`).
Authors set these through `sf-` utility classes (`sf-gap-md`, `sf-padding-lg`); themes
decide what each scale step resolves to. Chrome padding must go through `--sf-padding`
(see Size), since insets read it.

Themes cannot change layout **behaviour**. `sl-columns` is always a grid. `sl-split` is
always fixed-plus-flexible. No theme can make `sl-stack` horizontal.

### Container-responsive collapse

Collapse responds to the node's own container width, not the viewport. A `sl-columns`
nested inside a `sl-split` responds to the space it actually has.

A layout primitive only becomes a width container when it contains an `sl-collapse-*`,
`sl-hide-below-*` or `sl-show-below-*` element. Being a container makes a box ignore its own content when sizing its width, so
primitives without collapsing content stay out of it — otherwise an `sl-cluster` in a
table cell, button or dropdown would shrink to nothing.

```
sl-collapse-xs   collapse below xs breakpoint
sl-collapse-sm   collapse below sm breakpoint
sl-collapse-md   collapse below md breakpoint
```

The same widths swap what shows. `sl-hide-below-*` hides an element when its container is
at or below the width; `sl-show-below-*` shows it only then. Pair them to put a menu button
in place of a row of links. With no container around it the element always shows.

```
sl-hide-below-xs   sl-show-below-xs
sl-hide-below-sm   sl-show-below-sm
sl-hide-below-md   sl-show-below-md
```

---

## Themes

A theme is a set of token values plus optional class definition overrides, scoped by an
activation class on the element it themes or an ancestor (typically `<html>`).

```css
/* token settings — no layer needed (custom properties cascade per-property) */
.theme-editorial {
	--sf-primary-5: 30 64 175;
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

Picker choices land in storage by a uniform pattern:

- **Palette pick** → class pair on `node.attrs.class` (`sf-bg-primary-5` + `sf-bg-alpha-3`,
  same shape for `sf-color-*`, `sf-border-*`, `sf-shadow-color-*`). Stays in the cascade
  layer system; state classes and compound rules can still intercept.
- **Freeform value** (arbitrary hex, custom px, etc.) → inline `node.attrs.style`. Inline
  beats every layer, so this is the escape hatch — sacrifices cascade participation for
  arbitrary-value flexibility.
- **Shape/scale token pick** (`sf-shadow-md`, `sf-radius-2`, `sf-text-xl`) → single class
  on `node.attrs.class`; the utility rule composes with any accompanying runtime state
  vars.

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
