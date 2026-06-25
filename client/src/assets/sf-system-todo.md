# sf/sl System — Implementation Drift

Tracks gaps between `sf-system.md` (the spec) and the current codebase. The spec
describes the target design; this file enumerates what needs to change in code to match.

## Current state (resume here)

**Layout component migration in progress. Next: reseed local DB, verify `/styles/sf-system` output, then work through the pending items below.**

What's in place (migration 0008):

- Theme schema (`api/src/schemas/theme.ts`): `themes`, `theme_tokens`, `class_vocabulary`,
  `class_rules`, `class_rule_classes`, `user_theme_aliases` — all done.
- Layout schema (`api/src/schemas/layout.ts`): `collapse_thresholds(name, value, updated_at)` —
  system config separate from theme tables; user-editable, not wiped on reseed.
- Domain layer (`api/src/domain/`): `themes`, `themeTokens`, `classRules`,
  `collapseThresholds`, `seed` — all done.
- Runtime CSS generator (`api/src/domain/generateCss.ts`): reads all tables at request time,
  emits full stylesheet. Cached in-isolate by `themeSignature` (covers all tables incl.
  `collapse_thresholds`). ETag + `Cache-Control: public, max-age=60`.
- Seed (`seed.run` admin tRPC): Root/Dark/Pink themes + all tokens + full vocabulary
  (depth, heading, variants, state classes, layout primitives, collapse modifiers) +
  rules for depth/heading/variants/layout. Collapse thresholds seeded idempotently.
- `--sf-breakpoint-*` removed from tokens entirely; "breakpoint" term dropped.
  Collapse thresholds live in `collapse_thresholds` table; generator embeds pixel
  values directly in `@container` conditions.

### To resume here:

1. `pnpm dev:api`; hit `POST /trpc/seed.run` with an admin token — populates DB.
2. Open `http://localhost:8788/styles/sf-system` — verify token blocks, bundle/variant/
   layout layer blocks, collapse `@container` blocks, and editor-pairing classes.

Done (generator slice):

- `api/scripts/generate-css.mjs` deleted; replaced by `api/src/domain/generateCss.ts`
  (TypeScript, runs at request time).
- CSS served at `/styles/sf-system` via Pages Function
  `api/functions_src/styles/sf-system.ts`. Two-layer cache: in-isolate signature cache
    - Cloudflare Cache API (survives cold-starts; `waitUntil` put so first request isn't
      penalised). ETag + `Cache-Control: public, max-age=60` for browser/CDN.
- `generated-tokens.css`, `generated-classes.css`, `generated-editor-classes.css`
  deleted; `<link href="/styles/sf-system">` in `index.html` replaces them. Vite dev
  server proxies `/styles` → wrangler (`:8788`).
- `themeTokensStore` (Pinia) hydrates `themes.list` + `themes.listTokens` at startup
  (fire-and-forget from `main.ts`). Editor palettes derive reactively from `rootTokens`.
- `colorPalette.ts` + generator `classifyTokens`: `var()` semantic aliases (e.g.
  `--sf-primary`) excluded from palette bucket via TRIPLET guard — they are not numbered
  steps and would create phantom shades in the colour picker.

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
- `sf-heading-{1..3}` bundles — `font-size` + `line-height` at root
  (1 → `text-4xl`/`leading-tight`, 2 → `text-2xl`/`leading-snug`,
  3 → `text-xl`/`leading-snug`). Same posture as depth: minimal property set,
  add weight/tracking when a consumer argues for them.

Pipeline fixes uncovered while wiring sf-heading:

- **Tailwind preflight was beating `sf-bundle`** — `@tailwind base` was
  unlayered, and unlayered rules always win over any cascade layer. Preflight's
  `h1,h2,h3 { font-size: inherit }` was silently nullifying the bundle. Fix in
  `main.css`: wrap `@tailwind base` in a new `reset` layer declared first in
  the layer order. Tailwind components/utilities stay unlayered so utility
  classes still override sf-\* (intended).
- **`htmlBlueprint.ts` `parseSelector` regex was rejecting hyphenated tags**
  (`va-button`, etc.). Custom-element tags MUST contain a hyphen per the HTML
  spec, but the regex used `\w+`. The code-view toggle was silently failing
  because `initGenerateBlueprintHTML` threw during dynamic-node setup and the
  store's watchEffect swallowed it. Two fixes: regex now `[\w-]+`, and the
  store lazy-inits on first toggle with a try/catch that surfaces errors as
  Vuestic toasts (mobile-friendly — no console needed).
- **Attribute panel was filtering out `class`** (`ToolbarAttributeEditor.vue`).
  The filter was added speculatively ("class tokens cover it") but nodes
  without a `nodeClassTokens` entry lost the ability to edit `class` at all.
  Filter removed — `class` is now editable alongside `style` and `id` for any
  node that has `AllowAttributesExtension` global attrs.

CSS pipeline tightening (f0949af):

- `@layer` declaration hoisted to the top of `main.css` (before the `@imports`).
  The minifier had been reconciling source order, but the source is now spec-correct.
- `vite.config.ts` pins `build.cssTarget` to chrome87/edge88/firefox78/safari14 so
  esbuild keeps `(max-width: …)` syntax in `@media`. `@container` queries still
  emit range syntax `(width<=…)` — esbuild doesn't downgrade those, but Chrome 105+
  is required for container queries either way so it's a non-issue.
- `ColorPicker.vue` null-guards `snapToStep` (returns `AlphaStep | null` since
  a278e15). The missing guard was breaking type-check, which killed the build
  watch; wrangler kept serving the previous good chunks (pre-rename CSS with
  stale `var(--radius-*)` refs that resolved to nothing). When debugging visual
  regressions, always check that `pnpm dev`'s build half hasn't silently failed.

Known gap not in this slice:

- **Saved page content in D1 still carries pre-rename class tokens**
  (`sf-radius-md`, `sf-collapse-xs`, etc.). The CSS no longer defines those
  rules, so existing saved pages render unstyled when loaded by slug. Workaround:
  load with `?seed=true` to bypass `store.loadPage()` and re-parse
  `initialContent.html` instead. Per-user decision whether to write a migration
  or just reseed.

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
4. **Seed batching** — `seed.ts` loops with individual `await` per token/rule upsert
   (~160 round-trips to D1). D1's `db.batch()` or Drizzle's batch API would collapse
   this to a handful of requests. Not a correctness issue; only matters if seed time
   becomes noticeable (e.g. when running against production D1 over HTTP).

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

- [x] `sf-depth-*` bundles (`-0`, `-1`, `-2`, `-3`) — depth-0 is background only (canvas,
      no elevation). depth-1..3 carry background + shadow + radius; shadow escalates
      (md → lg → xl) and depth-3 gets a larger radius. Dark theme overrides the full
      surface palette (surface-0..9) so elevated surfaces lighten against the dark canvas.
- [x] `sf-heading-*` bundles (`-1`, `-2`, `-3`) — `font-size` + `line-height` at
      root. Wired via `SfHeading.addProseMirrorPlugins` appendTransaction in
      `contentExtensions.ts`: keeps `attrs.class` in sync with `attrs.level`
      (preserving other classes). `class` is the single source of truth — DOM,
      attribute panel, and code-view roundtrip all agree. `SfHeading` is shared
      with `htmlBlueprint.ts` so the code-view serializer matches the live editor.
- [x] `sf-variant-*` classes (`featured`, `subtle`, `danger`) — seeded in prior slice
- [ ] `sf-variant-warning` + `sf-variant-success` — added to spec; seed vocabulary + rules.
- [ ] `sf-size-*` bundles (`xs`, `sm`, `md`, `lg`, `xl`) — intended form factor; sets
      proportional visual properties (padding, border-radius, etc.). Seed vocabulary +
      rules; design pass needed to decide which properties each step sets.
- [ ] `sf-rank-*` bundles (`-1`, `-2`, `-3`) — absolute attention-weight scale; no relative-to-siblings
      assumption. Theme decides which CSS properties express each level (scale, padding, type weight,
      contrast, or a combination). Start with a minimal property set and add per consumer need, same
      posture as `sf-depth-*`. Seed vocabulary + rules; no editor wiring needed until a content-author
      picker is designed.
- [ ] `sf-edge-*` / `sf-divide-*` boundary classes — `sf-edge-{top,bottom,left,right,x,y,edge}` on
      the element itself; `sf-divide-{x,y}` on the parent targeting `> * + *`. Both in `sf-semantic`
      layer; theme decides full treatment (line, shadow, tint, spacing increase). Seed vocabulary +
      rules.
- [x] `sf-context` kind + `sf-is-overflow-start`/`sf-is-overflow-end` — ClassKind,
      Layer, sort order, and generator support added. Vocabulary + rules seeded (mask-image
      gradients; compound rule for both-edges case). `OverflowRow.vue` migrated from
      inline `maskStyle` computed to `sf-is-*` classes on the scroller element.
- [ ] `sf-is-loading` / `sf-is-sticky` / `sf-is-error` — added to spec; seed vocabulary +
      rules. Loading: skeleton shimmer or opacity reduction. Sticky: shadow or border on
      the pinned element. Error: border-color + optional background tint on the field.
- [ ] `sf-on-*` state class rules — vocabulary is seeded; `sf-on-selected` added to spec
      and needs seeding too. Pattern (per spec): seed one bare fallback rule per state,
      then compound overrides only for combinations that need different treatment. A design
      pass is still needed — what CSS properties change for hover/focus/active/selected/disabled
      at the root theme? Bare rules go in first; depth × variant compounds are additive only
      where the bare rule falls short.
- [x] `sl-*` layout primitives (`stack`, `cluster`, `columns`, `split`, `center`, `grid`) — vocabulary + rules in seed
- [ ] `sl-aspect` — added to spec; seed vocabulary + rules. Aspect ratio set via
      `--sl-aspect` custom property on the element.
- [x] `sl-collapse-*` container-responsive collapse classes — vocabulary in seed;
      CSS generated from `collapse_steps` table (DB-stored px values, not theme tokens;
      `var()` is not valid in `@container` conditions so values are read at emit time)
- [ ] **Migrate `--bg_secondary` consumers to `sf-depth-1`** — ~22 files. The
      solid-background uses (`rgb(var(--bg_secondary))`) become the `sf-depth-1`
      class directly. Translucent uses (`rgba(var(--bg_secondary) / var(--sf-alpha-9))`
      on floating UI like FloatingToolbar, FloatingDragHandle, ToolbarScrollHint,
      FloatingEditorMenu) need a per-element decision — those want depth + alpha at
      the use site, not the bundle. Removing `.sf-bg_secondary` from
      `sf-tokens.css` and `--bg_secondary` from `base.css` falls out of this slice.

## System design gaps (known, intentional for now)

These are not bugs but unresolved tensions in the current design:

- **Raw token refs in component CSS** — many components still reference `--border_color`,
  `--primary`, `--bg_secondary` etc. directly in their CSS. The correct approach is for
  components to use the class system (`sf-variant-*`, `sf-on-*`, depth bundles) rather than
  raw tokens, so themes can change the class definitions without touching component code.
  However, the class system doesn't yet have equivalents for everything (e.g. no "add a
  themed border" class, no "floating-surface at 90% opacity" class). These components must
  stay on raw tokens until the right higher-level class exists.
- **`--bg_secondary` migration** — cannot be replaced with a raw `--sf-surface-*` token
  because surface-N is just a numbered color slot, not a semantic "secondary surface" token.
  The right migration is to add the appropriate `sf-depth-N` bundle class to elements that
  match that depth level, and remove their explicit background CSS. Elements that need
  translucency (floating toolbars, drag handles) have no sf class equivalent yet.
- **Variant rules overriding bundle properties** — `sf-variant-outlined` and `sf-variant-plain`
  on LayoutCard use temporary in-component CSS to reset `box-shadow`/`background` that
  `sf-depth-1` sets. Once these enter the DB as proper variant rules, the in-component CSS
  can be removed.

## Editor + Vue components

- [x] ~~`nodeClassTokens.ts:21` uses prefix `sf-collapse-`. Collapse is arrangement →
      should be `sl-collapse-`.~~ Done — also updated `LayoutColumns.vue`,
      `LayoutSplit.vue`, and `initialContent.html`.
- [x] `LayoutCard.vue` — `sf-depth-1` added to root; variant prop now applies `sf-variant-${variant}`
      class; `feature` → `featured` rename; in-component CSS for `sf-variant-featured` removed
      (DB handles it); remaining variants (`elevated`, `outlined`, `filled`) keep temporary
      in-component CSS until their depth/variant rules enter the DB.
- [x] Layout components now carry `sl-*` identity class alongside `layout-*` (which stays as
      the `:global` CSS hook): `LayoutSection` → `sl-stack`, `LayoutColumns` → `sl-columns`,
      `LayoutSplit` → `sl-split`, `LayoutCenter` → `sl-center`. The DB-generated `sl-*` CSS
      applies to the root div (harmless — root has one child so flex/grid has no visual effect
      there); the real layout CSS targets `> [data-node-view-content]` via `:global`.
      Full migration (removing `layout-*` class and `:global` CSS) requires restructuring
      the content-wrapper pattern so `sl-*` classes can be applied directly to the layout div.
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
