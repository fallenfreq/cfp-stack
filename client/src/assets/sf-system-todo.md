# sf/sl System — Implementation Drift

Tracks gaps between `sf-system.md` (the spec) and the current codebase. The spec
describes the target design; this file enumerates what needs to change in code to match.

## Current state (resume here)

**The sf/sl migration is largely complete. All class families are seeded (depth, heading, variant, loudness, size, state, layout, context, element markers). Editor chrome is fully on intent-only composition. What remains is either "wait for a consumer" (sf-is-loading, sf-on-active), a structural refactor (layout full migration), or the Vuestic removal track.**

What's in place:

- Theme schema (`api/src/schemas/theme.ts`): `themes`, `theme_tokens`, `class_vocabulary`,
  `class_rules`, `class_rule_classes`, `user_theme_aliases` — all done.
- Layout schema (`api/src/schemas/layout.ts`): `collapse_thresholds(name, value, updated_at)` —
  system config separate from theme tables; user-editable, not wiped on reseed.
- Domain layer (`api/src/domain/`): `themes`, `themeTokens`, `classRules`,
  `collapseThresholds`, `seed` — all done.
- Runtime CSS generator (`api/src/domain/generateCss.ts`): reads all tables at request time,
  emits full stylesheet. Cached in-isolate by `themeSignature`. ETag + `Cache-Control: public, max-age=60`.
  `@layer` order declaration is the first rule emitted (in the HEADER constant) — the
  `<link rel="stylesheet" href="/styles/sf-system">` is synchronous so the declaration fires
  before Vite injects `main.css`.
- Seed (`api/src/domain/seed.ts`): Root/Dark/Pink themes + all tokens + full vocabulary +
  rules for depth/heading/variants/layout/overflow-context. Collapse thresholds seeded idempotently.
- Auto-reseed system: `api/src/domain/seedVersion.ts` exports `SEED_VERSION`; `generateCss.ts`
  warns on version mismatch but does NOT auto-reseed (avoids seeding with stale compiled code
  during a dev server restart race). First-boot only: `sf-system.ts` seeds when no root theme
  exists in D1. Dev endpoint `POST /dev/seed` (bearer-auth, absent in prod) + `pnpm seed:local`
  script for on-demand forced reseeds after seed.ts changes.
- `--sf-breakpoint-*` removed from tokens entirely; "breakpoint" term dropped.
  Collapse thresholds live in `collapse_thresholds` table; generator embeds pixel
  values directly in `@container` conditions.
- `sl-split`: `grid-template-columns` removed from scoped CSS — now fully in DB as
  `var(--sl-template, auto 1fr)` so the `@layer sl-layout` collapse rule can override it
  (same pattern as `sl-columns`). Collapse now works on both.

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
- Shadow colour migrated to the class-pair + inline-escape-hatch pattern (matches
  bg/text/border). Generator auto-emits `sf-shadow-color-*` + `sf-shadow-alpha-*`
  alongside the existing colour palette classes. `ToolbarShadowControl.vue` parses
  the picker's output — palette pick → class pair, freeform hex → inline
  `--sf-shadow-color`. Same var name for both paths; inline still beats layered
  classes so the escape hatch survives on top of a palette pick. Existing D1
  content with inline `--sf-shadow-color` (rgb string) continues to render
  correctly — no content migration required.
- `initialContent.html` migrated: `sf-radius-md` → `sf-radius-2`, `sf-radius-none` →
  `sf-radius-0`, then `sf-radius-0` on the full-bleed code block → `sf-is-edge-left sf-is-edge-right`.

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

1. ~~**Held — no consumer yet**: `sf-is-loading` / `sf-is-error`.~~ Both have rules and
   consumers (2.65.0; loading dims like disabled since 2.82.0 — see below). (`sf-on-active`
   and `sf-on-ancestor` have rules and a consumer: SiteNav, v2.71.0.)
2. **Raw token refs in component CSS** — many components still reference `--border_color`,
   `--primary`, `--text_primary` etc. directly. Migrate one-by-one as the right
   vocabulary class is seeded; no bulk pass until the class system covers the gap.
3. **Layout full migration** — removing `layout-*` class alongside `sl-*` requires
   restructuring the content-wrapper pattern. Deferred.
4. **Vuestic shim** — Vuestic compat tokens in `base.css` are hand-written, not sourced
   from the seed. Theme edits to `--sf-*` tokens don't propagate to `--text_primary` etc.
   Fix when Vuestic removal gets scheduled.
5. **Vuestic removal** — entire compat layer (`base.css` shim, `processTailwindColors`,
   `tailwind.config.js` palette refs, `sf-bg_secondary` class) goes in one sweep.
6. **Seed batching** — individual `await` per upsert (~160 round-trips). Use `db.batch()`
   if seed time becomes a problem against production D1.

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
      `@layer reset, ui, sf-bundle, sf-variant, sf-context, sf-semantic, sf-utility, sf-state;`
      `ui` sits between `reset` and `sf-bundle` so component default CSS can be
      overridden by any sf layer. Component `<style>` blocks should be wrapped in
      `@layer ui { }`. The name is `ui` (not `components`) because Tailwind's PostCSS
      plugin hijacks `@layer components` and requires a matching `@tailwind components`
      directive in the same file — using our own name sidesteps that entirely.
- [x] Static `RESET` block — `generateCss.ts` emits a hardcoded `@layer reset { }` for
      normalizations with no theme dependency (`td > *:last-child { margin-bottom: 0 }`).
      Add new reset rules here; no seed bump needed.
- [x] Generator emits all auto-derived classes (semantic canonicals, value-linked
      utilities, editor palette + alpha pairings) inside their matching `@layer`
      blocks. The remaining "wrap in @layer" work is for the **legacy** hand-written
      `sf-tokens.css` sections — those go away with the editor migration rather than
      being wrapped, so no separate layer-wrapping pass is needed.
- [x] Token names — `--sf-*` names are already correct in the DB seed and generated
      at runtime. Legacy unprefixed names (`--text-*`, `--alpha-*`, etc.) survive in
      `base.css` as Vuestic compat and stay there until Vuestic is removed. No rename
      pass is needed or correct.
- [x] Rename `.dark` theme class to `.theme-dark` to match the spec's theme activation
      convention. Done across `base.css`, `darkModeStore.ts`, `index.html`,
      `tailwind.config.js`; `.pink` → `.theme-pink` same pass.

## Token notes

The `--sf-*` token names are already correct in the DB seed and generated at runtime.
Legacy unprefixed names (`--text-*`, `--alpha-*`, `--primary-*`, etc.) in `base.css`
are Vuestic compat — they stay until Vuestic is removed. No bulk rename pass is needed.

Component CSS that reaches for raw tokens directly is using the escape hatch. The right
migration is to the vocabulary class system (per-component decision), not renaming the
token reference.

**Utility/semantic classes (`sf-color-*`, `sf-bg-*`, etc.) are for content authors in the
editor — not for component code.** Replacing a raw token ref with a utility class is the
same coupling problem. Components migrate to vocabulary classes (`sf-variant-*`, `sf-depth-*`,
`sf-on-*`) so the theme owns the output through the seed.

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
- [x] `sf-variant-*` classes — `featured`, `danger`, `warning`, `success`, `alt-1` seeded.
      `sf-variant-danger` bare = text colour only; `sf-depth-1 × sf-variant-danger` = full
      solid button. Depth context determines the treatment, not a separate class.
- [x] `sf-size-*` bundles (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`) — form-factor scale; theme
      picks which properties express each step. This theme spends size on `--sf-padding`;
      bare `button` and `input` element rules in the seed consume it as `padding`, so any
      element carrying `sf-size-*` without local CSS gets scale-appropriate padding for free.
      Shape (`border-radius`) is deliberately not on this axis — comes from the element's
      own rule or an explicit `sf-radius-*` utility. `2xs` (0.25rem) added for breadcrumb /
      dense chip density.
- [x] `sf-loudness-*` bundles (`-1`, `-2`, `-3`) — vocabulary seeded; direction fixed to higher = more
      attention (consistent with all other numbered scales; heading-\* is the only exception, forced by
      HTML convention). Compound rules seeded for `sf-depth-1 × sf-loudness-1/3`. No editor wiring
      needed until a content-author picker is designed.
- [x] `sf-variant-alt-1` — vocabulary + compound rule seeded (`sf-size-xs.sf-variant-alt-1` → pill
      corners). Numbered from the start so alt-2 etc. are additive. The "alt" is relative to the
      default rendering of the full class combination, not just depth or loudness.
- [x] `sf-boundary-*` / `sf-divide-*` — vocabulary + rules seeded as `bundle` kind
      (`sf-bundle` layer). Multi-property theme compositions belong here, not in the
      auto-derived semantic layer. `AdminListItem` sticky actions cell carries
      `sf-boundary-left`; empty header `th` intentionally omitted (no content).
- [x] `sf-context` kind + `sf-is-overflow-{left,right,top,bottom}` — ClassKind,
      Layer, sort order, and generator support added. Vocabulary + rules seeded (mask-image
      gradients; same-axis compound rules for both-edges case). `OverflowRow.vue` migrated from
      inline `maskStyle` computed to `sf-is-*` classes on the scroller element.
- [x] `sf-is-edge-{top,right,bottom,left}` — viewport-flush context; vocabulary + rules seeded
      (zeros the two corners that touch the boundary). Author-applied (not JS-toggled).
- [x] `sf-is-overlay` — vocabulary + bare rule seeded. Reads `--sfx-surface-color` (bridge variable
      set by `sf-depth-*` bundles) so one rule covers all depths without duplicating colour
      knowledge. Establishes the `--sfx-*` bridge variable convention — documented in spec.
- [x] `sf-is-sticky` — vocabulary + bare rule seeded (border-bottom, done in 280e9fc).
- [x] `sf-element` layer + element markers — new `element` class kind + `sf-element`
      layer (declared below `sf-bundle` in the cascade order). Bare element rules
      (`button`, `input`, `table`, `td`, `th`, `tr`) now emit into this layer rather than
      `sf-bundle`, so any bundle/variant/state layered on top wins predictably — same
      baseline behaviour HTML elements get for free. `sf-chip` marker seeded as
      vocabulary (no rules yet — held to the spec's admission test: add rules when a
      consumer needs shape/colour distinct from bare `<button>`).
- [x] Bare `button` element rule — seeded in `sf-element`. `border-radius:
var(--sf-radius-2)`; `padding: var(--sf-padding, 0)` consumes the size axis so
      components with `sf-size-*` get scale-appropriate padding without writing
      `padding: var(--sf-padding)` locally; `font: inherit` so nested buttons pick up
      their container's type scale (e.g. `sf-text-xs` on a wrapper). Compound with
      `sf-is-overlay` bumps to pill. `cursor: pointer` (2.83.0) — the theme owns it, no
      longer Tailwind preflight; busy (progress) and disabled (not-allowed) override it.
- [x] Busy announcement — SfButton calls `announce('Loading')` (services/announce.ts)
      when `loading` turns on while it has focus; one hidden live region, SfAnnouncer,
      mounted in App and inside every modal `<dialog>` (content outside an open modal is
      inert; a closed dialog hides its copy, so exactly one is read). Out-of-sight CSS is
      component-owned, not theme vocab. A new modal must hold an `<SfAnnouncer />`. Each
      message goes only to the copy that could be heard when sent (`inModal`). SfButton
      takes focus when pressed if focus fell to something around it (Safari / macOS
      Firefox don't focus clicked buttons); mousedown.prevent buttons keep focus where it
      was. A busy button also announces when focus lands on it. announce() warns in dev
      when an open modal has no SfAnnouncer.
- [x] Bare `input` element rule — seeded in `sf-element`. Same padding/font contract as
      `button`. `input:focus-visible` sets `color: rgb(var(--sf-fg_primary))` +
      `background: rgba(var(--sf-fg_primary) / var(--sf-alpha-1))` — the "being edited"
      look. Any input in the app that gains focus now picks this up; components no
      longer need per-instance chrome for the editing state.
- [x] `sf-is-contained` context — vocabulary + rule seeded. Author-declared "this
      element sits inside a container that already provides visual boundary". Default
      expression drops the element's own chrome (`background: none`,
      `border-color: transparent`); theme can swap for reduced padding or muted colour.
      Consumers: NodePath breadcrumb button, EditorTopBar name/toggle/action buttons,
      ToolbarButton, SfOverflowMenu anchor.
- [x] Bare table element rules — seeded in `sf-element` (bare element selectors, specificity
      0-0-1). `table`: `border-collapse: separate; border-spacing: 0` (separate required for
      `box-shadow` on sticky cells). `td`: `border-bottom`, `vertical-align: middle`,
      `padding: --sf-spacing-xs --sf-spacing-sm`. `th`: same border + padding + `text-align: left`,
      `vertical-align: middle`, `font-weight: 600`. `tr:last-child td`: removes orphan bottom border.
      Depth compounds: `sf-depth-1 th` gets compact admin header treatment (xs font, uppercase,
      tracked, muted, nowrap) — specificity 0-1-1 beats bare th without extra classes on cells.
      Table padding lives in the seed (sf-element / sf-bundle layers) so `@layer ui`
      cell padding cannot override it — component-level padding differences must become
      seed compound rules.
- [x] `sf-is-loading` / `sf-is-error` — Loading: busy cursor + opacity 0.4 (2.82.0). A busy
      SfButton is never natively disabled (it would drop focus): aria-disabled + the click is
      stopped instead. Error: danger border (× sf-on-focus keeps danger).
- [ ] `sf-on-*` state class rules — vocabulary seeded for all states. Bare rules done for
      `sf-on-hover` (fg + subtle fill; no border channel yet — see hover-border
      investigation above), `sf-on-focus` (primary border-color; see also bare
      `input:focus-visible` in `sf-element` for the "being edited" look),
      `sf-on-disabled` (opacity 0.4 + not-allowed; vocab pseudo `:disabled`),
      `sf-on-selected` (2px primary outline; stateful, no pseudo — outline chip pattern:
      ColorPicker, ToolbarShadowControl, ToolbarCornersControl, FontPicker),
      `sf-on-current` (primary bg tint + border-color + text; stateful, no pseudo — "this
      option is on right now": ToolbarButton, NodePath leaf, ToolbarNodePicker, SlashCommands
      keyboard-highlighted item, EditorTopBar toggle when actions open. Border-color-only
      is invisible on bare buttons — see investigation above),
      `sf-on-ancestor` (muted primary text; stateful, no pseudo — reserved for
      nav/breadcrumb ancestors, no consumers yet). Compound done for
      `sf-on-hover × sf-variant-danger`. `sf-on-active` (pseudo `:active`): pressed tint one
      step past hover, bare + × loudness-2 + × current (v2.71.0; first consumer SiteNav).
- [x] `sl-*` layout primitives (`stack`, `cluster`, `columns`, `split`, `center`, `grid`) — vocabulary + rules in seed
- [x] `sl-aspect` — four preset classes seeded (`sl-aspect-16-9`, `sl-aspect-4-3`,
      `sl-aspect-1-1`, `sl-aspect-9-16`). `ToolbarAspectControl.vue` chip-picker
      registered in `defaultItemsStyle.ts` (shows on any block node, single selection).
      Bare `sl-aspect` kept in vocabulary as developer escape hatch (`--sl-aspect` inline).
- [x] `sl-collapse-*` container-responsive collapse classes — vocabulary in seed;
      CSS generated from `collapse_steps` table (DB-stored px values, not theme tokens;
      `var()` is not valid in `@container` conditions so values are read at emit time)
- [x] Migrate `--bg_secondary` consumers to `sf-depth-1` — done in commit 5a95dfe.
      Translucent floating-UI consumers (FloatingToolbar, FloatingDragHandle) use
      `sf-depth-2 sf-is-overlay` — surface translucency covered.

## Editor chrome migration (in progress)

Composing intent-only class combos instead of hand-written chrome. The pattern is:
component declares axes (`sf-is-contained`, `sf-loudness-*`, `sf-on-hover`,
`sf-size-*`, etc.) + carries only layout/positioning locally; theme owns colour,
background, border, radius, focus/hover expression via seed rules.

Done:

- [x] `ToolbarButton.vue` — now `SfButton` with `sf-is-contained`, `size="xs"` and
      `@mousedown.prevent`; `current`/`disabled` pass through. No local rules.
- [x] `NodePath.vue` — each block is an `SfButton` (`sf-single-line sf-is-contained`,
      loudness 1, size xs, `current` for the chosen depth, Doc `disabled`); container gets
      `sf-text-xs` (buttons inherit via bare `button { font: inherit }`); local
      rules are layout only. Previous asymmetric `padding: 1px 5px` replaced by
      the size axis feeding the bare button rule.
- [x] `EditorTopBar.vue` — top-bar container gets `sf-text-xs` (drops local
      `font-size`); `.top-bar__name` input carries `sf-is-contained sf-loudness-1
sf-on-hover sf-size-2xs`. The ⋯ toggle and Settings are `SfIconButton`, Save is
      `SfTooltip` + `SfButton` (`loading`, `variant` from the save state), all
      `sf-is-contained`, loudness 1, size 2xs; the toggle is `current` + `aria-expanded`. `.is-renaming` compound
      reduced to layout (flex grow / max-width / overflow / cursor); the editing
      look (fg-primary + subtle bg tint) now comes from bare `input:focus-visible`
      in the seed, driven by the input's own focus/blur.
- [x] `SlashCommands.vue` — `.dropdown-menu` gets `sf-depth-2 sf-size-2xs`; menu
      items get `sf-on-hover sf-size-2xs` (+ conditional `sf-on-current`);
      `.no-commands` placeholder gets `sf-loudness-1 sf-size-2xs`. Border and
      border-radius dropped locally — chrome is depth-2's call.
- [x] `SfIconButton.vue` — `SfTooltip` + `SfButton` + `SfIcon`; the tooltip is also
      the button's name. `size` defaults to `xs`; other `SfButton` props pass through.
- [x] `SfOverflowMenu.vue` — anchor carries `sf-is-contained` and `:loudness="1"`;
      dropdown container passes `sf-size-${size}` through to `sf-overflow-menu`.
- [x] `CodeViewToggle.vue` — floating toggle now composes `sf-depth-2 sf-is-overlay`
      on top of ToolbarButton. See "To investigate" — ToolbarButton's hardwired
      `sf-is-contained` may be stripping depth-2's chrome here.
- [x] `ToolbarScrollHint.vue` — hardcoded `padding: 4px 12px` replaced by the size
      class. Now an `SfButton` (`sf-depth-2 sf-is-overlay`, size xs) named "Scroll to
      toolbar"; centred with auto margins (not a transform a theme could override);
      gaps are `--sf-spacing-xs` / `--sf-spacing-md`, the scroll math keeps `+ 8`.
- [x] `ToolbarNodePicker.vue` rows and `ToolbarAttributeEditor.vue` add rows are
      `SfButton`s; full-width rows set `display: flex`, `justify-content: start` and
      `white-space: normal` over SfButton's centred single-line default.
- [x] Toolbar-picker state classes migrated from legacy `is-active`:
      `ColorPicker.vue`, `FontPicker.vue`, `ToolbarCornersControl.vue`,
      `ToolbarShadowControl.vue` chips → `sf-on-selected` (outline-chip pattern);
      `ToolbarNodePicker.vue` items and `SlashCommands.vue` keyboard-highlighted
      item → `sf-on-current` (tinted-fill pattern). Legacy local `.is-active`
      rules removed; expression comes from the seed.
- [x] Form-input focus/disabled expression migrated from local `:focus` CSS to
      state classes: `ToolbarAttrRow.vue`, `ToolbarRevealInput.vue`,
      `ToolbarCornersControl.vue` inputs carry `sf-on-focus` (+ `sf-on-disabled`
      on the corners inputs). Local `:focus { border-color: … }` blocks removed.
- [x] `@layer components` → `@layer ui` bulk rename across component `<style>`
      blocks touched in this slice (~13 files). Mechanical rename to match the
      Foundational cascade order; no per-component tracking needed going forward.

## System design gaps (known, intentional for now)

These are not bugs but unresolved tensions in the current design:

- **Raw token refs in component CSS** — many components still reference `--border_color`,
  `--primary` etc. directly in their CSS. The correct approach is for components to use the
  class system (`sf-variant-*`, `sf-on-*`, depth bundles) rather than raw tokens, so themes
  can change class definitions without touching component code. The class system doesn't yet
  have equivalents for everything (e.g. no "add a themed border" class, no
  "floating-surface at 90% opacity" class). These components must stay on raw tokens until
  the right higher-level class exists. Gap values are resolved — all component CSS now uses `var(--sf-gap, var(--sf-spacing-*))`
  (keeps the channel open with a scale-step default) or `sl-*` + `sf-gap-*` (structural
  layout containers where `sf-gap-*` is authored on the node).
- **`--bg_secondary` migration** — cannot be replaced with a raw `--sf-surface-*` token
  because surface-N is just a numbered color slot, not a semantic "secondary surface" token.
  The right migration is to add the appropriate `sf-depth-N` bundle class to elements that
  match that depth level, and remove their explicit background CSS. Floating/translucent
  surfaces use `sf-depth-N sf-is-overlay` — `sf-is-overlay` reads `--sfx-surface-color`
  (set by the depth bundle) at `--sf-alpha-9`.

## Editor + Vue components

- [x] ~~`nodeClassTokens.ts:21` uses prefix `sf-collapse-`. Collapse is arrangement →
      should be `sl-collapse-`.~~ Done — also updated `LayoutColumns.vue`,
      `LayoutSplit.vue`, and `initialContent.html`.
- [x] `LayoutCard.vue` — wears `sf-depth-1`; variant prop removed entirely (cb1a466);
      cards are composed with vocabulary classes (`sf-variant-alt-1`, `sf-variant-featured`,
      `sf-loudness-*`) at the call site rather than via a prop. No in-component variant CSS.
- [x] Layout components now carry `sl-*` identity class alongside `layout-*` (which stays as
      the `:global` CSS hook): `LayoutSection` → `sl-stack`, `LayoutColumns` → `sl-columns`,
      `LayoutSplit` → `sl-split`, `LayoutCenter` → `sl-center`. The DB-generated `sl-*` CSS
      applies to the root div (harmless — root has one child so flex/grid has no visual effect
      there); the real layout CSS targets `> [data-node-view-content]` via `:global`.
      Full migration (removing `layout-*` class and `:global` CSS) requires restructuring
      the content-wrapper pattern so `sl-*` classes can be applied directly to the layout div.
- [x] Layout components moved to `components/layout/` — they are general components; TipTap
      wraps them externally so the components themselves have no editor dependency. Call sites
      outside the editor use them directly with `sf-gap-*` as a class attribute.
- [x] `LayoutCard.vue` — wears `sf-depth-1`; background inherited from bundle (5a95dfe).

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

## Deferred (pending design pass)

- [x] **Chip / button colour styling** — done in d4f8d74 (v2.19.0). `sf` membership
      marker added (opt-in, keeps third-party elements unaffected); `sf-chip` bundle seeded
      (pill radius, ghost border, single-line); bare variant changed to text-tint only;
      loudness governs fill weight (1=dim text, 2=outlined, 3=solid+inverted);
      `sf-on-hover × sf-loudness-3` darken compounds added per variant; toolbar chip buttons
      (`ToolbarAspectControl`, `FontPicker`, `ToolbarShadowControl`, `ToolbarCornersControl`)
      migrated from local `.ap/.fp/.sp/.cp-chip` CSS to `sf sf-chip sf-size-xs sf-on-hover sf-on-selected`.

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
