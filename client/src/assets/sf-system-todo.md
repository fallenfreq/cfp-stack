# sf/sl System — Implementation Drift

Tracks gaps between `sf-system.md` (the spec) and the current codebase. The spec
describes the target design; this file enumerates what needs to change in code to match.

## Foundational

- [ ] Declare cascade layers in CSS:
      `@layer sf-bundle, sf-variant, sf-semantic, sf-utility, sf-state;`
      (`sf-state` must be highest so hover/focus win over utility-set properties.)
- [ ] Wrap all class definitions — including theme overrides — in their matching
      `@layer` block. Unlayered CSS beats layered CSS regardless of specificity, so any
      bare `.theme-x .sf-depth-1 { ... }` would silently break the override order.
      Token declarations on the theme class itself (`.theme-x { --sf-X: ... }`) stay
      unlayered.
- [ ] Apply the token rename pass — prefix, renumber, and rename per the spec
      contract (see "Token renames" below). Currently only runtime-state vars carry
      the `--sf-` prefix (`--sf-gap`, `--sf-padding`, `--sf-bg-alpha`,
      `--sf-shadow-color`).
- [ ] Rename `.dark` theme class to `.theme-dark` to match the spec's theme activation
      convention. `base.css:68, 103` define it; references elsewhere in code need
      updating too.

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
- [ ] Add `--sf-weight-{1..4}` definitions in `base.css` (no current code) and
      `sf-weight-*` utility classes in `sf-tokens.css`

### Semantic tokens — rename to sf canonical; Vuestic-side duplicates the value

- [ ] `--text_primary` → `--sf-fg_primary` (canonical). Keep `--text_primary` in the
      Vuestic block with duplicated value.
- [ ] Add `--sf-fg_inverted` (new sf semantic token). `--text_inverted` keeps its
      current name with duplicated value.
- [ ] `--border_color` → `--sf-border_color`. Vuestic shim duplicates value.
- [ ] `--primary` → `--sf-primary` (single-word brand semantic; distinct from the
      palette renumber). Vuestic shim duplicates value.
- [ ] `--shadow` → `--sf-shadow`. Vuestic shim duplicates value.

### Pipeline + consumer updates

- [ ] `tailwind.config.js` — update palette refs (`var(--primary-500)` etc.) to the
      renumbered/prefixed names (`var(--sf-primary-5)` etc.)
- [ ] All `sf-tokens.css` utility class bodies — update to reference renamed tokens
- [ ] `LayoutCard.vue`, `main.css`, and any other consumer of `--text_primary`,
      `--border_color`, `--bg_*` etc. — update to either the sf canonical name or
      the Vuestic shim name (decide per consumer)

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

None of these exist in the codebase yet:

- [ ] `sf-depth-*` bundles (`-0`, `-1`, `-2`, `-3`)
- [ ] `sf-heading-*` bundles (`-1`, `-2`, `-3`)
- [ ] `sf-variant-*` classes (`featured`, `subtle`, `danger`)
- [ ] `sf-on-*` state classes (`hover`, `focus`, `active`, `disabled`)
- [ ] `sl-*` layout primitives (`stack`, `cluster`, `columns`, `split`, `center`, `grid`)
- [ ] `sl-collapse-*` container-responsive collapse classes

## Editor + Vue components

- [ ] `nodeClassTokens.ts:21` uses prefix `sf-collapse-`. Collapse is arrangement →
      should be `sl-collapse-`.
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
