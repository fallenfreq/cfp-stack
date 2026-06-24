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
CSS properties — not just different values.

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

| Class                | Belongs? | Why                                                       |
| -------------------- | -------- | --------------------------------------------------------- |
| `sf-variant-danger`  | Yes      | Danger is intent                                          |
| `sf-on-hover`        | Yes      | Hover is a state                                          |
| `sf-depth-1`         | Yes      | Visual layer position coordinates perceived hierarchy     |
| `sf-variant-subtle`  | No       | Redundant — rank covers attention weight                  |
| `sl-columns`         | Yes      | Columns is structure                                      |
| `sf-fg_primary`      | Yes      | Shared semantic value                                     |
| `sf-rank-1`          | Yes      | Attention hierarchy is relational, not a visual treatment |
| `sf-is-overflow-end` | Yes      | Runtime condition set by JS, not authored intent          |
| `sf-edge-top`        | Yes      | Edge signals boundary intent, not a CSS property          |
| `sf-divide-y`        | Yes      | Divide signals separation between children                |
| `sf-variant-glass`   | No       | Glass is a visual treatment, not intent                   |
| `sf-variant-card`    | No       | Card is an implementation concept                         |
| `sl-sidebar`         | No       | Sidebar names content, not structure                      |

If understanding the class requires knowing what the theme looks like or what the
content is, it does not belong.

The classes shown here are the current vocabulary; new bundle families, variants, and
states join through the same admission test.

Slot labels come in three kinds. **Named** (`xs/sm/md/lg`, `tight/normal/wide`) encode
intrinsic magnitudes — themes scale values; ordering is locked by the name's physical
meaning. **Numbered, semantically positioned** (`depth-0..3`, `heading-1..3`, `rank-1..3`)
encode an external concept (z-stack position, document hierarchy, attention hierarchy);
the ordering is meaningful by what it maps to. **Numbered, arbitrary** (`primary-1..N`,
`alpha-1..N`, `weight-1..N`) are pure slot positions — the theme decides values; adjacent
slots imply no ordering.

---

## Cascade layers

CSS cascade layers fix the override order regardless of source order:

```css
@layer sf-bundle, sf-variant, sf-context, sf-semantic, sf-utility, sf-state;
```

Layers are declared lowest to highest priority; inline styles override all of them.

| Layer         | Holds                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| `sf-bundle`   | Multi-property bundles like `sf-depth-*`, `sf-heading-*`                      |
| `sf-variant`  | `sf-variant-*` — modifiers overlaid on a bundle                               |
| `sf-context`  | `sf-is-*` — JS-detected runtime conditions (overflow, selection, etc.)        |
| `sf-semantic` | Single-property bindings to a shared semantic token (e.g. `sf-fg_primary`)    |
| `sf-utility`  | Single-property bindings to a scale step (e.g. `sf-text-xl`)                  |
| `sf-state`    | `sf-on-*` — interaction modifiers (highest so hover/focus win over utilities) |

Single-property classes (semantic, utility) outrank variant: explicit per-property
overrides win over intent-level modifiers.

`sl-` layout classes sit outside this order. They govern arrangement and do not compete
with `sf-` classes for the same properties.

All class definitions — defaults and theme overrides alike — must live inside their
matching `@layer` block. **Unlayered CSS beats all layered CSS** regardless of
specificity, so an override written outside a layer would silently destroy the order.
Token declarations (`.theme-x { --sf-X: ... }`) are exempt — custom properties cascade
per-property by specificity and don't need to live in a layer.

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
--sf-breakpoint-* container width  (xs, sm, md)
--sf-primary-*    primary palette  (1..9)
--sf-surface-*    neutral palette  (0..9)
--sf-alpha-*      alpha values     (1..9)
--sf-weight-*     font weight      (1..4)
--sf-radius-*     border radius    (0..3)
--sf-font-*       font family      (1, 2, 3, mono)
```

A theme sets the values; the slot set itself is fixed.

**Semantic tokens**: single shared values with a named meaning. Composite names use
underscores (`--sf-fg_primary`); single-word names don't (`--sf-primary`).

```
--sf-fg_primary      default foreground
--sf-fg_inverted     foreground on brand/inverse surfaces
--sf-primary         brand colour
--sf-border_color    border colour
--sf-shadow          shadow colour
```

A theme changes the value; every reference picks it up.

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

**Editor-pairing classes are the one exception.** A picker UI emits a class pair
(`sf-bg-primary-5` + `sf-bg-alpha-3`) instead of inline `style` so cascade specificity
stays well-behaved — inline style outranks every layer, which would block state classes
(`sf-on-hover`, etc.) from overriding the picked colour. The class pair works because
the colour utility sets a runtime modifier var (`--sf-bg-alpha`) reset to `1`, and the
alpha class overrides it. The reset is required to fence the cascade against itself.

This pattern lives entirely in the editor-pairing surface (`sf-{bg|color|border}-*`
palette utilities and their `sf-{bg|color|border}-alpha-*` siblings). Component authors
should not reach for it; they pick the colour token whose value already encodes the
opacity they want, or compose at the use site. Bundles paint solid and don't participate.

### When a token belongs

Two rules:

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

---

## sf- classes

Five layers in cascade order. The same authoring pattern applies everywhere — defaults
and theme overrides both live inside the matching `@layer` block:

```css
@layer sf-bundle {
	/* default — uses tokens for values */
	.sf-depth-1 {
		background: rgb(var(--sf-surface-1));
		box-shadow: var(--sf-shadow-md);
		border-radius: var(--sf-radius-2);
	}

	/* theme override — same layer, higher specificity wins */
	.theme-flat .sf-depth-1 {
		box-shadow: none;
		border: 1px solid rgb(var(--sf-border_color));
	}
}
```

Tokens for values. Class overrides for which properties to use. Theme authors work
entirely within the shared token vocabulary — no class-specific intermediate tokens.

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

**Headings** — typographic prominence:

```
sf-heading-1   most prominent
sf-heading-2   secondary
sf-heading-3   tertiary
```

**Rank** — attention hierarchy among sibling content blocks:

```
sf-rank-1   highest attention — most visual weight, spacing, prominence
sf-rank-2   moderate attention
sf-rank-3   lowest attention — de-emphasised, supporting content
```

Rank is an absolute scale of attention weight, not a claim about neighbours. A block set
to `sf-rank-1` carries maximum visual weight on every page it appears, whether or not
any `sf-rank-2` or `sf-rank-3` blocks are present. The theme applies the same treatment
consistently — like a loudness dial where the block declares its level and the theme
decides what each level sounds like.

The theme decides which CSS properties express each level — scale, padding, type weight,
contrast, or a combination. Depth coordinates layering relationships; rank is independent
of that — a depth-2 dropdown can be any rank.

**Size** — intended form factor. Declares what an element is meant to be, so the theme
applies proportional visual properties — padding, border-radius, and similar. A container
query fires on measured width, which means overfilled content would change the element's
style as it grows — a pill that looks like a pill until it gets too wide is wrong. The
size class stays fixed to the intent.

```
sf-size-xs   pill, badge, icon button
sf-size-sm   compact — small button, tag
sf-size-md   standard form factor
sf-size-lg   large button, featured tile
sf-size-xl   hero scale
```

Size is independent of depth and rank. A small pill can be `sf-depth-2 sf-rank-1
sf-variant-featured sf-size-xs`; the four axes do not constrain each other.

Bundle values can be extracted into named tokens (e.g. `--sf-depth-0-background`) so
application chrome and authors can reference them without re-applying the bundle.

More bundle families join this layer when added.

### Variants — `sf-variant`

Semantic intent modifiers. The bundle still applies; the variant tells the theme what role
this element plays so it can be expressed appropriately — a star, a colour, a badge,
whatever fits.

```
sf-variant-featured   editorially selected or promoted — a featured product, a highlight
sf-variant-danger     destructive or warning action
```

Variants are not about visual weight — that is rank's job. `sf-variant-featured` on a
small pill and on a full-width hero section both signal the same intent; the theme decides
how to express it at each size.

### Context — `sf-context`

Runtime conditions detected by JavaScript and applied as classes. They reflect facts about
the current state of the DOM — measurements or conditions that CSS alone cannot know.

```
sf-is-overflow-start   content is clipped at the leading edge
sf-is-overflow-end     content is clipped at the trailing edge
```

`sf-is-*` classes differ from `sf-on-*` in source and meaning:

|         | `sf-on-*`                              | `sf-is-*`                          |
| ------- | -------------------------------------- | ---------------------------------- |
| Set by  | Author intent                          | JavaScript measurement             |
| Meaning | "this element should respond to hover" | "this condition is currently true" |
| Example | `sf-on-hover`                          | `sf-is-overflow-end`               |

Multiple `sf-is-*` classes may be present simultaneously and can be compounded in rules
— a rule requiring both `sf-is-overflow-start` and `sf-is-overflow-end` handles the
both-edges case at higher specificity than either alone.

### States — `sf-state`

Interaction modifiers. Composable: combined with a variant, the theme can specialise via
a more specific selector.

```
sf-on-hover
sf-on-focus
sf-on-active
sf-on-disabled
```

```css
@layer sf-state {
	/* default */
	.sf-on-hover:hover {
		background: rgb(var(--sf-fg_primary) / 0.05);
	}

	/* specialised for featured */
	.sf-variant-featured.sf-on-hover:hover {
		background: rgb(var(--sf-primary) / 0.05);
	}
}
```

### Semantic — `sf-semantic`

Single-property classes that bind one CSS property to a shared semantic token (underscore
naming, mirroring the token name).

```
sf-fg_primary    color:        rgb(var(--sf-fg_primary))
sf-border_color    border-color: rgb(var(--sf-border_color))
```

The author signals "this property should track a theme value"; the theme controls the
value.

### Boundaries — `sf-semantic`

Two families that signal visual separation intent. The theme decides the full treatment —
line weight, style, colour, spacing increase, or any multi-property composition. No scale
step is involved; the hyphen here is a positional qualifier, not a scale selector.

**Edge — visual boundary on the element's own sides:**

```
sf-edge-top
sf-edge-bottom
sf-edge-left
sf-edge-right
sf-edge-x      left and right
sf-edge-y      top and bottom
sf-edge        all four
```

**Divide — visual boundary between an element's children (applied to the parent):**

```
sf-divide-x    between horizontally arranged children
sf-divide-y    between vertically arranged children
```

Divide targets `> * + *`. `sf-divide-y` pairs naturally with `sl-stack`; `sf-divide-x`
with `sl-cluster` or `sl-columns`.

### Utility — `sf-utility`

Single-property classes that bind one CSS property to a specific scale step (hyphen
naming, mirroring the token name).

```
sf-radius-3       border-radius: var(--sf-radius-3)
sf-shadow-md       box-shadow:    var(--sf-shadow-md)
sf-text-xl         font-size:     var(--sf-text-xl)
sf-gap-md          --sf-gap:      var(--sf-spacing-md)
sf-padding-lg      --sf-padding:  var(--sf-spacing-lg)
```

`sf-gap-*` and `sf-padding-*` set runtime-state custom properties (`--sf-gap`,
`--sf-padding`) that layout primitives read — this is how the styling system feeds
spacing into the layout system without compromising layout's structural fixity.

---

## sl- layout subsystem

Arrangement has its own prefix because it's a separate concern from appearance. Both
prefixes coexist on the same node:

```html
<div class="sl-columns sf-depth-1 sf-variant-featured sf-gap-lg"></div>
```

`sf-*` utilities set runtime variables that `sl-*` primitives read; the reverse is not
a pattern.

### Layout primitives

Six structural patterns:

```
sl-stack      vertical stack
sl-cluster    horizontal wrap
sl-columns    grid — equal or custom ratio via --sl-cols
sl-split      one fixed-width side, one flexible side
sl-center     max-width centering
sl-grid       auto-responsive — fills with as many columns as fit at a minimum width
```

`sl-columns` and `sl-split` are not variants of each other. Columns is proportional
(equal or custom ratios via `--sl-cols: 1fr 2fr`). Split is fixed-plus-flexible — one
side holds its width, the other takes the rest.

### Theme contract

Themes can influence layout **metrics** via the tokens layout primitives read — gap,
padding, max-width, minimum column width. Authors set these through `sf-` utility classes
(`sf-gap-md`, `sf-padding-lg`); themes decide what each scale step resolves to.

Themes cannot change layout **behaviour**. `sl-columns` is always a grid. `sl-split` is
always fixed-plus-flexible. No theme can make `sl-stack` horizontal.

### Container-responsive collapse

Collapse responds to the node's own container width, not the viewport. A `sl-columns`
nested inside a `sl-split` responds to the space it actually has:

```
sl-collapse-xs   collapse below xs breakpoint
sl-collapse-sm   collapse below sm breakpoint
sl-collapse-md   collapse below md breakpoint
```

---

## Themes

A theme is a set of token values plus optional class definition overrides, scoped by an
activation class on an ancestor (typically `<html>`).

```css
/* token settings — no layer needed (custom properties cascade per-property) */
.theme-editorial {
	--sf-primary-5: 30 64 175;
}

/* class overrides — must live in the matching layer */
@layer sf-bundle {
	.theme-editorial .sf-depth-1 {
		box-shadow: none;
		border-left: 4px solid rgb(var(--sf-primary));
	}
}
```

The expected case is a complete theme. A sparse theme works too, falling back to root
values for anything it doesn't override; the root theme is always active.

Storage and generation are application concerns.

---

## Naming convention

| Class                         | Kind     | Example                      | Meaning                                          |
| ----------------------------- | -------- | ---------------------------- | ------------------------------------------------ |
| `sf-{family}-*`               | Bundle   | `sf-depth-1`, `sf-heading-2` | Multi-property bundle                            |
| `sf-variant-*`                | Variant  | `sf-variant-featured`        | Bundle modifier expressing intent                |
| `sf-on-*`                     | State    | `sf-on-hover`                | Interaction modifier                             |
| `sf-is-*`                     | Context  | `sf-is-overflow-end`         | JS-detected runtime condition                    |
| `sf-*_*` (underscore)         | Semantic | `sf-fg_primary`              | One property, mirrors a composite token name     |
| `sf-*-*` (hyphen, scale step) | Utility  | `sf-text-xl`                 | One property, explicit scale step                |
| `sf-edge-*` / `sf-divide-*`   | Boundary | `sf-edge-top`, `sf-divide-y` | Boundary intent on own edges or between children |
| `sl-*`                        | Layout   | `sl-columns`                 | Structural arrangement                           |

---

## Editor integration

The editor exposes the content-author surface — picker controls translate to `sf-` and
`sl-` classes on `node.attrs.class`. Component-author and theme-author surfaces live
outside the editor.

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
