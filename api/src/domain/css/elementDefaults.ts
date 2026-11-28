// Page-wide baselines read from the theme's tokens: the page's colours and type, and the
// focus ring. Emitted before the DB's sf-element rules, so a theme's rules for the same
// selectors win within the layer; themes also override via sf-bundle or higher.
export const SF_ELEMENT_DEFAULTS = `@layer sf-element {
	body {
		color: rgb(var(--sf-fg_primary));
		background-color: rgb(var(--sf-surface_page));
		font-family: var(--sf-font-1);
		font-size: var(--sf-text-base);
		line-height: var(--sf-leading-relaxed);
	}
	/* Keyboard focus: a ring in the text colour, against the element. An element with a line
	   shows it with the line's own rules (sf-system.md, "Line parts"). A look that shows focus
	   another way sets the ring's strength to 0, which forced colours still draws. */
	*:focus-visible {
		outline: var(--sf-stroke-2) solid rgb(var(--sf-fg_primary) / var(--sfx-ring-alpha, 1));
	}
}`
