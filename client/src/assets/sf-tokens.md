# sf-tokens — Design Token Utility Classes

All design token values are stored as `sf-` CSS classes on elements. This makes toolbar controls
and the attribute panel automatically in sync — they both read and write `node.attrs.class`.

---

## Naming rule

**`class = sf- + CSS variable name (minus --)`**

The variable name encodes the token type via its separator:

| Separator  | Token type      | Example variable | Example class   |
| ---------- | --------------- | ---------------- | --------------- |
| Hyphen     | Scale / palette | `--radius-md`    | `sf-radius-md`  |
| Underscore | Semantic        | `--bg_primary`   | `sf-bg_primary` |

---

## Spacing classes

Spacing classes set only the CSS custom property — NOT the direct CSS property. Layout
components read the custom property in their `:global` content selector, which applies
gap/padding to the inner content area rather than the outer wrapper.

```
sf-gap-md      → --sf-gap: var(--spacing-md)
sf-padding-lg  → --sf-padding: var(--spacing-lg)
```

Layout components read `var(--sf-gap, 0)` and `var(--sf-padding, 0)` in their inner content
selector (`[data-node-view-content]`). The custom property cascades from the node's class
through to the content element, so card padding appears inside the border/shadow and column
gap appears between cells.

**Inheritance isolation**: Every `[data-node-view-wrapper]` resets both variables to `0`
(via a rule in `sf-tokens.css` before the class rules). This prevents outer layout nodes
from leaking their spacing into nested layout nodes that have no class set.

---

## Colour classes

### Property prefixes for palette colours

```
sf-bg-primary       → background-color: rgb(var(--primary) / var(--sf-bg-alpha))
sf-bg-primary-500   → background-color: rgb(var(--primary-500) / var(--sf-bg-alpha))
sf-color-primary    → color: rgb(var(--primary) / var(--sf-color-alpha))
sf-color-danger     → color: rgb(var(--danger) / var(--sf-color-alpha))
```

### Semantic colours (no property prefix needed)

The variable name already encodes the intended CSS property:

```
sf-bg_primary   → background-color: rgb(var(--bg_primary) / var(--sf-bg-alpha))
sf-bg_secondary → background-color: rgb(var(--bg_secondary) / var(--sf-bg-alpha))
sf-bg_element   → background-color: rgb(var(--bg_element) / var(--sf-bg-alpha))
sf-text_primary → color: rgb(var(--text_primary) / var(--sf-color-alpha))
sf-text_inverted→ color: rgb(var(--text_inverted) / var(--sf-color-alpha))
sf-border_color → border-color: rgb(var(--border_color) / var(--sf-border-alpha))
```

### Cross-property semantic classes

For the rare case of applying a semantic variable to a non-canonical property
(e.g. using `--bg_primary` as a text colour), property-prefixed semantic classes exist:

```
sf-color-text_primary  → color: rgb(var(--text_primary) / var(--sf-color-alpha))
sf-color-bg_primary    → color: rgb(var(--bg_primary) / var(--sf-color-alpha))
sf-bg-text_primary     → background-color: rgb(var(--text_primary) / var(--sf-bg-alpha))
```

These are generated automatically by the toolbar colour controls and text colour marks.

---

## Alpha classes

Alpha is property-scoped. Instead of baking alpha into every colour class, separate
alpha classes set a CSS custom property that the colour class reads:

```
sf-bg-alpha-60      → --sf-bg-alpha: var(--alpha-60)
sf-color-alpha-60   → --sf-color-alpha: var(--alpha-60)
sf-border-alpha-60  → --sf-border-alpha: var(--alpha-60)
```

**How it works:**

- Every colour class resets its own alpha variable to `1`:
  `.sf-bg-primary { --sf-bg-alpha: 1; background-color: rgb(var(--primary) / var(--sf-bg-alpha)); }`
- Alpha classes come **after** colour classes in `sf-tokens.css`. Same specificity means the
  last declaration wins — alpha overrides the reset when both are on the same element.
- On child elements, the child's own colour class resets alpha again, preventing parent
  alpha from bleeding in.

**Named aliases** also have alpha classes: `sf-bg-alpha-subtle`, `sf-bg-alpha-muted`, `sf-bg-alpha-half`.

---

## Shadow hybrid

Shadow size is a class token; shadow colour is an inline custom property:

```
class="sf-shadow-md"
style="--sf-shadow-color: rgb(var(--primary) / var(--alpha-30))"
```

The shadow class reads `var(--sf-shadow-color)` with a fallback of
`rgb(var(--shadow) / var(--alpha-20))` (the default shadow colour).

---

## Storage convention

| Value type                                                                | Storage                                                       |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Design-token values (radius, spacing, shadow size, font, colour)          | `node.attrs.class`                                            |
| Arbitrary / custom values (custom px border-radius, arbitrary hex colour) | `node.attrs.style`                                            |
| Shadow colour                                                             | `--sf-shadow-color` CSS custom property in `node.attrs.style` |

Priority: inline style > class > CSS default.

---

## Extending the system

To add a new token category:

1. **Add CSS variables** to `base.css` following the naming convention.
2. **Add classes** to `sf-tokens.css` following the same naming rule.
3. **Add to `nodeClassTokens.ts`** if the tokens should appear in the attribute panel for
   specific node types.
4. If a new toolbar control is needed, use `getClassToken` / `setClassToken` from
   `utils/editor/classTokens.ts` to read and write the class attribute.
