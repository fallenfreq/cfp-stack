# sf/sl System — Implementation Drift

Tracks gaps between `sf-system.md` (the spec) and the current codebase. The spec
describes the target design; this file enumerates what needs to change in code to match.

## Current state (resume here)

DB-driven token + class pipeline is live. The generator now emits three files from D1:

- `generated-tokens.css` — `:root` + `.theme-*` token declarations (unlayered)
- `generated-classes.css` — core sf classes: semantic canonicals (`sf-fg_primary`,
  `sf-fg_inverted`, `sf-border_color`) in `@layer sf-semantic`; value-linked utilities
  (typography, radius, spacing, shadow) in `@layer sf-utility`
- `generated-editor-classes.css` — editor-pairing classes (palette picks
  `sf-{bg|color|border}-{token}` + the `sf-{bg|color|border}-alpha-{1..9}` siblings)
  in `@layer sf-utility`

Run with `pnpm generate:css`. All three files are in `.prettierignore`. `main.css`
imports them in order after `base.css`, before legacy `sf-tokens.css`.

Done so far:

- Spec finalised (slot-label principle, semantic vocabulary, range tokens, alpha
  pairing rationale) — see `sf-system.md`.
- DB schema for themes + tokens + rich-class tables (`class_vocabulary` and
  `class_properties` now hold the `sf-depth-*` family; variants/states still empty).
- Seed data for `root`, `dark`, `pink` themes — includes the new
  `--sf-shadow-opacity` token (theme-character knob; `0.12` at root).
- Three-file generator with property-mapping rules in code, plus rich-class layer
  emission from `class_vocabulary` + `class_properties` (one `@layer` block per
  layer; root defaults + `.theme-X` override rows).
- Cascade layer declaration in `main.css`.
- `.dark` / `.pink` → `.theme-dark` / `.theme-pink` across CSS, JS, Tailwind config,
  and the OS-preference preload script.
- `sf-collapse-*` → `sl-collapse-*` rename (collapse is arrangement, not appearance).
- `sf-depth-{0..3}` bundles — background-only at root (each binds to its matching
  `--sf-surface-N`). Theme colour shifts cascade through the token; no per-theme
  override rows needed.

Done in the editor + cleanup slice:

- Editor migrated to `--sf-*` vocabulary end-to-end: `extractCssVars` reads both
  `base.css` and `generated-tokens.css`, fixes the stale `.dark` / `.pink` selectors
  (Vuestic dark/pink presets were silently empty since the rename — now restored).
- `colorPalette.ts`, `alphaPalette.ts`, `fontPalette.ts`, `layoutTokens.ts`,
  `textColorMark.ts`, `fontStyleMark.ts`, `ToolbarColorControl.vue`,
  `ToolbarFontControl.vue`, `ToolbarCornersControl.vue` all use `--sf-*` prefixes.
  `snapToStep` returns `AlphaStep | null` — the fallback was making up an arbitrary
  "closest to opaque" step that doesn't exist in the new range.
- Component CSS rename: 128 `var(--alpha-N)` references migrated to `var(--sf-alpha-N)`
  across ~25 files. Legacy `--alpha-{0..100}`, `--shadow-{sm..xl}`, `--radius-*`,
  `--text-*`, `--leading-*`, `--tracking-*`, `--spacing-*`, `--font-{sans,serif,mono}`,
  `--breakpoint-*` deleted from `base.css`.
- `sf-tokens.css` reduced from 675 lines to ~25: TipTap reset + the one `sf-bg_secondary`
  class that has live consumers (others were speculative).
- Generator's `sf-shadow-*` classes now respect inline `--sf-shadow-color` override
  (preserves the picker's per-element colour pick capability).
- `initialContent.html` migrated: `sf-radius-md` → `sf-radius-2`, `sf-radius-none` →
  `sf-radius-0`.

### What's intentionally still legacy

- **`base.css`** keeps the Vuestic-compat block: `--primary-{50..950}`, `--surface-*`,
  semantic Vuestic colours (`--bg_primary`, `--text_primary`, `--secondary`, etc.),
  `--shadow`, `--shadow-opacity`. Tailwind config references these via `processTailwind`
  Colors. Whole block goes when Vuestic is removed.
- **`sf-tokens.css`** keeps `.sf-bg_secondary` for the consumers it still has
  (`BasicCard.vue`, `StackableSheet.vue`, `contentExtensions.ts`,
  `initialContent.html`, plus ~18 component files that reference `--bg_secondary`
  directly via `rgb(var(--bg_secondary))` or `rgba(... / var(--sf-alpha-9))`).
  `sf-depth-{0..3}` now exists — the consumer migration is its own slice and
  removes this class plus `--bg_secondary` from `base.css`.

What's pending:

1. **Rich classes** — bundles (`sf-depth-*`, `sf-heading-*`), variants
   (`sf-variant-*`), states (`sf-on-*`), layout primitives (`sl-*`). These need
   `class_vocabulary` + `class_properties` rows and generator support beyond the
   property-mapping rules. Likely the next slice — see "Implement missing class
   families" below.
2. **`tailwind.config.js`** palette refs (`var(--primary-500)` etc.) — can stay until
   Vuestic is removed; renaming them to `var(--sf-primary-5)` is a no-op since both
   tokens carry the same value.
3. **Vuestic shim** — duplicating values: keep `--text_primary` etc. but source values
   from the corresponding `--sf-*` tokens via the seed (so theme authors only edit one
   place). Currently the Vuestic-compat values in `base.css` are hand-written, not
   driven from the DB.

## Schema notes

Three concepts in the DB:

- `themes` (PK: slug). Activation class for non-root themes.
- `theme_tokens` (PK: theme_slug + name). The token vocabulary; `kind` column for
  editor introspection (`color-triplet`, `length`, `number`, `text`, `shadow-shape`).
- `class_vocabulary` + `class_properties` (empty; PK: theme_slug + class_name +
  css_property). Hold rich classes only (bundles, variants, states). Thin-wrapper
  classes (semantic single-property, scale utility, palette utility, alpha pairing)
  are NOT stored — they're derived by the generator from `theme_tokens` + a
  property-mapping list that lives in code.

This split keeps the DB small and makes the editor source-of-truth for "what classes
exist" clean: query `theme_tokens` + apply mapping rules to get the auto-generated
classes; query `class_vocabulary` for the rich ones.

## Foundational

- [x] Declare cascade layers in CSS:
      `@layer sf-bundle, sf-variant, sf-semantic, sf-utility, sf-state;`
      Done in `main.css`.
- [x] Generator emits all auto-derived classes (semantic canonicals, value-linked
      utilities, editor palette + alpha pairings) inside their matching `@layer`
      blocks. The remaining "wrap in @layer" work is for the **legacy** hand-written
      `sf-tokens.css` sections — those go away with the editor migration rather than
      being wrapped, so no separate layer-wrapping pass is needed.
- [ ] Apply the token rename pass — prefix, renumber, and rename per the spec
      contract (see "Token renames" below). The new tokens already exist in
      `generated-tokens.css`; the work is migrating remaining consumers (tailwind
      config, editor code, component CSS) off the legacy unprefixed names.
- [x] Rename `.dark` theme class to `.theme-dark` to match the spec's theme activation
      convention. Done across `base.css`, `darkModeStore.ts`, `index.html`,
      `tailwind.config.js`; `.pink` → `.theme-pink` same pass.

## Token renames

All current CSS variables need to be renamed to match the spec contract. Mechanical
but large. Vuestic-side variables keep their current names and duplicate the new sf
values (interim until DB-generated CSS lands).

### Range tokens — prefix; renumber families where shape changed

- [ ] `--text-{xs..9xl}` → `--sf-text-*`
- [ ] `--spacing-{none, xs..xl}` → `--sf-spacing-*`
- [ ] `--leading-*` → `--sf-leading-*`
- [ ] `--tracking-*` → `--sf-tracking-*`
- [ ] `--shadow-{sm..xl}` → `--sf-shadow-*`
- [ ] `--breakpoint-{xs, sm, md}` → `--sf-breakpoint-*` (new to spec)
- [ ] `--radius-{none, sm, md, lg}` → `--sf-radius-{0..3}` (named → numbered; update
      all `sf-radius-*` utility classes too)
- [ ] `--alpha-{0, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100}` →
      `--sf-alpha-{1..9}` (drop 25/75 oddballs; renumber)
- [ ] `--primary-{50..950}` → `--sf-primary-{1..9}` (drop 50/950 bookends; renumber)
- [ ] `--surface-{0..950}` → `--sf-surface-{0..9}` (drop bookends; renumber;
      `surface-0` keeps the "canvas" meaning)
- [ ] `--font-{sans, serif, mono}` → `--sf-font-{1, 2, mono}` (sans → 1, serif → 2,
      mono stays as functional slot; font-3 reserved)
- [x] Add `--sf-weight-{1..4}` definitions (in DB seed) and `sf-weight-*` utility
      classes (auto-generated).

Added in this slice:

- [x] `--sf-shadow-opacity` theme-character token (one value per theme; root = 0.12).
      Consumed by the auto-generated `sf-shadow-*` utilities inside the shadow's
      `box-shadow` composition. Themes can override per-theme for stronger/softer
      shadow character.

### Semantic tokens — rename to sf canonical; Vuestic-side duplicates the value

The new `--sf-*` semantic tokens already exist in `generated-tokens.css`. The work
below is the Vuestic-side shim — keeping legacy names defined in `base.css` with
duplicated values so Vuestic's `processTailwindColors` keeps working.

- [ ] Keep `--text_primary` in `base.css`'s Vuestic block with value duplicated from
      the new `--sf-fg_primary`.
- [ ] Keep `--text_inverted` (legacy) duplicated from `--sf-fg_inverted`.
- [ ] Keep `--border_color` (legacy) duplicated from `--sf-border_color`.
- [ ] Keep `--primary` (legacy) duplicated from `--sf-primary` (the brand semantic).
- [ ] Keep `--shadow` (legacy) duplicated from `--sf-shadow`.

### Pipeline + consumer updates

- [ ] `tailwind.config.js` — update palette refs (`var(--primary-500)` etc.) to the
      renumbered/prefixed names (`var(--sf-primary-5)` etc.)
- [x] ~~All `sf-tokens.css` utility class bodies — update to reference renamed tokens~~
      Superseded by the generator. Legacy `sf-tokens.css` sections are kept while the
      editor still emits legacy class names; they will be deleted with the editor
      alpha-step rename slice rather than rewritten.
- [ ] Editor alpha-step rename (next slice): `textColorMark.ts`,
      `ToolbarColorControl.vue`, `alphaPalette.ts`, `colorPalette.ts`. Read from
      `--sf-*` palette tokens and emit new-step class names (`sf-bg-primary-5`,
      `sf-bg-alpha-3`, etc.).
- [ ] `LayoutCard.vue`, `main.css`, and any other consumer of `--text_primary`,
      `--border_color`, `--bg_*` etc. — update to either the sf canonical name or
      the Vuestic shim name (decide per consumer).

## Token cleanup

- [ ] Remove the alpha semantic aliases from `base.css:184-186` (`--alpha-subtle`,
      `--alpha-muted`, `--alpha-half`). Per the spec's "aliases only for theme-level
      decisions" rule, "subtle"/"muted"/"half" are styling opinions baked into names,
      not theme decisions. Callers should use the `--sf-alpha-*` range directly.
- [ ] When removing those aliases, also remove the
      `sf-{bg|color|border}-alpha-{subtle|muted|half}` utility classes in
      `sf-tokens.css:569-577, 618-626, 667-675` — they reference the aliases and
      would silently break otherwise.

## Implement missing class families

- [x] `sf-depth-*` bundles (`-0`, `-1`, `-2`, `-3`) — background only; bundle
      properties beyond background (shadow, radius) intentionally deferred so the
      classes are drop-in replacements for `--bg_secondary` consumers that already
      carry their own radius / shadow. Add more properties when a consumer's needs
      argue for them.
- [ ] `sf-heading-*` bundles (`-1`, `-2`, `-3`)
- [ ] `sf-variant-*` classes (`featured`, `subtle`, `danger`)
- [ ] `sf-on-*` state classes (`hover`, `focus`, `active`, `disabled`)
- [ ] `sl-*` layout primitives (`stack`, `cluster`, `columns`, `split`, `center`, `grid`)
- [ ] `sl-collapse-*` container-responsive collapse classes
- [ ] **Migrate `--bg_secondary` consumers to `sf-depth-1`** — ~22 files. The
      solid-background uses (`rgb(var(--bg_secondary))`) become the `sf-depth-1`
      class directly. Translucent uses (`rgba(var(--bg_secondary) / var(--sf-alpha-9))`
      on floating UI like FloatingToolbar, FloatingDragHandle, ToolbarScrollHint,
      FloatingEditorMenu) need a per-element decision — those want depth + alpha at
      the use site, not the bundle. Removing `.sf-bg_secondary` from
      `sf-tokens.css` and `--bg_secondary` from `base.css` falls out of this slice.

## Editor + Vue components

- [x] ~~`nodeClassTokens.ts:21` uses prefix `sf-collapse-`. Collapse is arrangement →
      should be `sl-collapse-`.~~ Done — also updated `LayoutColumns.vue`,
      `LayoutSplit.vue`, and `initialContent.html`.
- [ ] Vue layout components currently use bare class names that predate the system: - `LayoutCard.vue` — `layout-card`, `variant-elevated`/`outlined`/`filled`/`plain`/`feature` - `LayoutSection.vue` — `layout-section` - `LayoutColumns.vue` — `layout-columns` - `LayoutSplit.vue` — `layout-split` - `LayoutCenter.vue` — `layout-center`
      Migrate to apply `sl-*` for arrangement and `sf-*` for appearance/variant.
- [ ] `LayoutCard.vue:32` references `--bg_secondary` directly. Once `sf-depth-*`
      bundles exist, the card should wear `sf-depth-1` and inherit its background
      from there.

## Vuestic compatibility (temporary)

Vuestic is the current UI library and will be removed eventually. It requires specific
token names that aren't part of the sf/sl system design and are deliberately absent from
the spec. Until Vuestic is removed:

- Keep these tokens in `base.css`, organised under a clearly-labelled
  "Vuestic compatibility" section so the dependency is visible at a glance:
    - `--bg_primary`, `--bg_secondary`, `--bg_element`
    - `--text_inverted` (foreground for elements painted with `--primary`)
    - `--secondary`, `--success`, `--info`, `--danger`, `--warning`, `--focus`
    - `--shadow-opacity`, `--primary-inverse`, `--primary-hover`,
      `--primary-active-color`, `--primary-highlight-*`
- Vuestic's config (`vuestic.my.config.ts`) consumes these via the JS processing
  pipeline (`processTailwindColors`), so renames there need coordination.
- When Vuestic is removed, this entire section of `base.css` and all `sf-bg_*` /
  `sf-color-bg_*` / `sf-bg-text_*` classes that exist solely to expose these tokens
  through the sf- vocabulary can be deleted in one sweep.

## Deferred (decided in spec review, not done)

- `--sf-fg_primary`, `--sf-fg_inverted`, `--sf-border_color`, `--sf-primary`,
  `--sf-shadow` retained as legitimate system semantic tokens (broadly applicable,
  not Vuestic-specific). The underscore form on composite names (`fg_primary`,
  `fg_inverted`, `border_color`) follows the spec convention.
- Typography bundles now in spec as `sf-heading-*` (parallel family to `sf-depth-*`
  inside `sf-bundle` layer). Implementation tracked under "Implement missing class
  families" above. Other typography families (`sf-body-*`, `sf-caption-*`, etc.) can
  join later as new families inside the bundle layer.
- Status colour classes (`sf-variant-success`, `sf-variant-info`, `sf-variant-warning`)
  not added — only `featured`, `subtle`, `danger` are in the variant set. Status
  semantics may want their own treatment when Vuestic is removed.
