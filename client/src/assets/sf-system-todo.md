# sf/sl System — Implementation Drift

Tracks gaps between `sf-system.md` (the spec) and the current codebase. The spec
describes the target design; this file enumerates what needs to change in code to match.

## Foundational

- [ ] Declare cascade layers in CSS:
      `@layer sf-bundle, sf-variant, sf-semantic, sf-utility, sf-state;`
      (`sf-state` must be highest so hover/focus win over utility-set properties.)
- [ ] Wrap all class definitions — including theme overrides — in their matching
      `@layer` block. Unlayered CSS beats layered CSS regardless of specificity, so any
      bare `.theme-x .sf-surface-1 { ... }` would silently break the override order.
      Token declarations on the theme class itself (`.theme-x { --sf-X: ... }`) stay
      unlayered.
- [ ] Prefix all system tokens with `--sf-`. Currently unprefixed in `base.css` and
      `sf-tokens.css` (e.g. `--text-xl`, `--primary-500`, `--text_primary`). Only
      runtime-state vars carry the prefix today (`--sf-gap`, `--sf-padding`,
      `--sf-bg-alpha`, `--sf-shadow-color`).

## Token cleanup

- [ ] Remove the alpha semantic aliases from `base.css:184-186` (`--alpha-subtle`,
      `--alpha-muted`, `--alpha-half`). Per the spec's "aliases only for theme-level
      decisions" rule, "subtle"/"muted"/"half" are styling opinions baked into names,
      not theme decisions. Callers should use the `--sf-alpha-*` range directly.

## Implement missing class families

None of these exist in the codebase yet:

- [ ] `sf-surface-*` bundles (`-0`, `-1`, `-2`, `-3`)
- [ ] `sf-heading-*` bundles (`-1`, `-2`, `-3`)
- [ ] `sf-variant-*` classes (`featured`, `subtle`, `danger`)
- [ ] `sf-on-*` state classes (`hover`, `focus`, `active`, `disabled`)
- [ ] `sl-*` layout primitives (`stack`, `cluster`, `columns`, `split`, `center`, `grid`)
- [ ] `sl-collapse-*` container-responsive collapse classes

## Editor + Vue components

- [ ] `nodeClassTokens.ts:21` uses prefix `sf-collapse-`. Collapse is arrangement →
      should be `sl-collapse-`.
- [ ] Vue layout components currently use bare class names that predate the system: - `LayoutCard.vue` — `layout-card`, `variant-elevated`/`outlined`/`filled`/`plain`/`feature` - Other components in `client/src/components/editor/layout/` likely similar
      Migrate to apply `sl-*` for arrangement and `sf-*` for appearance/variant.
- [ ] `LayoutCard.vue:32` references `--bg_secondary` directly. Once `sf-surface-*`
      bundles exist, the card should wear `sf-surface-1` and inherit its background
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

- `--sf-text_primary`, `--sf-border_color`, `--sf-primary`, `--sf-shadow` retained as
  legitimate system semantic tokens (broadly applicable, not Vuestic-specific). The
  underscore form on `text_primary` / `border_color` is the convention for composite
  semantic names per the spec.
- Typography bundles now in spec as `sf-heading-*` (parallel family to `sf-surface-*`
  inside `sf-bundle` layer). Implementation tracked under "Implement missing class
  families" above. Other typography families (`sf-body-*`, `sf-caption-*`, etc.) can
  join later as new families inside the bundle layer.
- Status colour classes (`sf-variant-success`, `sf-variant-info`, `sf-variant-warning`)
  not added — only `featured`, `subtle`, `danger` are in the variant set. Status
  semantics may want their own treatment when Vuestic is removed.
