// Classes that say where a block sits among its siblings, not how it looks or arranges what's
// inside it. A block a component renders wears them on its wrapper too — the box its parent
// places: the editor's PlacementClasses extension puts them there, and the CSS reaches them
// there (nodeViewSelectors.ts). A trailing '-' names a family. Imports nothing, so the client
// reads the same list (@somefreq-app/api/placementClasses).
export const PLACEMENT_CLASSES = [
	'sl-row',
	'sl-bleed',
	'sl-pin-',
	'sl-hide-below-',
	'sl-show-below-',
] as const

export function isPlacementClass(name: string): boolean {
	return PLACEMENT_CLASSES.some((p) => (p.endsWith('-') ? name.startsWith(p) : name === p))
}
