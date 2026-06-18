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

| Class               | Belongs? | Why                                     |
| ------------------- | -------- | --------------------------------------- |
| `sf-variant-danger` | Yes      | Danger is intent                        |
| `sf-on-hover`       | Yes      | Hover is a state                        |
| `sf-depth-1`        | Yes      | Elevation is relational                 |
| `sl-columns`        | Yes      | Columns is structure                    |
| `sf-text_primary`   | Yes      | Shared semantic value                   |
| `sf-variant-glass`  | No       | Glass is a visual treatment, not intent |
| `sf-variant-card`   | No       | Card is an implementation concept       |
| `sl-sidebar`        | No       | Sidebar names content, not structure    |

If understanding the class requires knowing what the theme looks like or what the
content is, it does not belong.

The classes shown here are the current vocabulary; new bundle families, variants, and
states join through the same admission test.

---

## Cascade layers

CSS cascade layers fix the override order regardless of source order:

```css
@layer sf-bundle, sf-variant, sf-semantic, sf-utility, sf-state;
```

Layers are declared lowest to highest priority; inline styles override all of them.

| Layer         | Holds                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| `sf-bundle`   | Multi-property bundles like `sf-depth-*`, `sf-heading-*`                      |
| `sf-variant`  | `sf-variant-*` — modifiers overlaid on a bundle                               |
| `sf-semantic` | Single-property bindings to a shared semantic token (e.g. `sf-text_primary`)  |
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

**Range tokens** (hyphen): ordinal steps in a scale.

```
--sf-text-*       font size        (xs through 9xl)
--sf-weight-*     font weight      (100 through 900)
--sf-leading-*    line height      (none, tight, snug, normal, relaxed, loose)
--sf-tracking-*   letter spacing   (tight, normal, wide)
--sf-radius-*     border radius    (none, sm, md, lg)
--sf-spacing-*    spacing scale    (xs through xl)
--sf-primary-*    primary palette  (50 through 950)
--sf-surface-*    neutral palette  (0 through 950)
--sf-shadow-*     shadow elevation (sm through xl)
--sf-alpha-*      alpha values     (0 through 100)
```

Steps are ordinal and fixed. A theme sets the values; the steps themselves do not change.

**Semantic tokens**: single shared values with a named meaning. Composite names use
underscores (`--sf-text_primary`); single-word names don't (`--sf-primary`).

```
--sf-text_primary    foreground colour
--sf-primary         brand colour
--sf-border_color    border colour
--sf-shadow          shadow colour
```

A theme changes the value; every reference picks it up.

### Colours and alpha

Colours are stored as RGB triplets — three space-separated values, no `rgb()` wrapper:

```css
--sf-primary-500: 16 185 129;
--sf-text_primary: 38 40 36;
```

Composed at the use site:

```css
background: rgb(var(--sf-primary-500)); /* solid */
background: rgb(var(--sf-primary-500) / 0.5); /* literal */
background: rgb(var(--sf-primary-500) / var(--sf-alpha-10)); /* range token */
```

One colour token serves all opacities — the class count stays linear instead of
multiplicative.

Classes can also set runtime alpha modifiers (`--sf-bg-alpha`, `--sf-color-alpha`,
`--sf-border-alpha`) that paired classes read — a utility binding a palette step to
background composes against `--sf-bg-alpha`, which a co-present `sf-bg-alpha-*` class
can set.

A theme override of a single-property colour class must keep the composing form —
writing `rgb(var(--sf-X))` instead of `rgb(var(--sf-X) / var(--sf-bg-alpha))` silently
disables co-present `sf-bg-alpha-*` classes. Bundles paint solid and don't participate.

### When a token belongs

Two rules:

**Used in more than one place.** A token earns its place only if its value is used in more
than one place. A token used in exactly one class is an indirection — replace it with the
primitive it points to.

- `--sf-shadow` ✓ — every shadow references it
- `--sf-card-radius` ✗ if it only appears in `.sf-card`; use `var(--sf-radius-md)` directly

**Aliases only for theme-level decisions.** A semantic alias over a scale step is
legitimate only when it represents a theme-level choice. `--sf-primary` = `--sf-primary-500`
is valid because the theme decides which palette step is the brand. `--sf-alpha-subtle` =
`--sf-alpha-10` is not — "subtle" is a styling opinion, not a theme decision. Use the
scale step directly.

---

## sf- classes

Five layers in cascade order. The same authoring pattern applies everywhere — defaults
and theme overrides both live inside the matching `@layer` block:

```css
@layer sf-bundle {
	/* default — uses tokens for values */
	.sf-depth-1 {
		background: rgb(var(--sf-surface-50));
		box-shadow: var(--sf-shadow-md);
		border-radius: var(--sf-radius-md);
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

**Depth** — position in the visual stack:

```
sf-depth-0   canvas / page
sf-depth-1   one level above — cards, wells
sf-depth-2   further raised — dropdowns, popovers
sf-depth-3   topmost — modals
```

**Headings** — typographic prominence:

```
sf-heading-1   most prominent
sf-heading-2   secondary
sf-heading-3   tertiary
```

Bundle values can be extracted into named tokens (e.g. `--sf-depth-0-background`) so
application chrome and authors can reference them without re-applying the bundle.

More bundle families join this layer when added.

### Variants — `sf-variant`

Modifiers overlaid on a bundle to express semantic intent. The bundle still applies; the
variant changes how it reads.

```
sf-variant-featured   prominent, calls for attention
sf-variant-subtle     deemphasised, secondary
sf-variant-danger     destructive or warning
```

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
		background: rgb(var(--sf-text_primary) / 0.05);
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
sf-text_primary    color:        rgb(var(--sf-text_primary))
sf-border_color    border-color: rgb(var(--sf-border_color))
```

The author signals "this property should track a theme value"; the theme controls the
value.

### Utility — `sf-utility`

Single-property classes that bind one CSS property to a specific scale step (hyphen
naming, mirroring the token name).

```
sf-radius-lg       border-radius: var(--sf-radius-lg)
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
	--sf-primary-500: 30 64 175;
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

| Class                 | Kind     | Example                      | Meaning                           |
| --------------------- | -------- | ---------------------------- | --------------------------------- |
| `sf-{family}-*`       | Bundle   | `sf-depth-1`, `sf-heading-2` | Multi-property bundle             |
| `sf-variant-*`        | Variant  | `sf-variant-featured`        | Bundle modifier expressing intent |
| `sf-on-*`             | State    | `sf-on-hover`                | Interaction modifier              |
| `sf-*_*` (underscore) | Semantic | `sf-text_primary`            | One property, theme-controlled    |
| `sf-*-*` (hyphen)     | Utility  | `sf-text-xl`                 | One property, explicit scale step |
| `sl-*`                | Layout   | `sl-columns`                 | Structural arrangement            |

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
