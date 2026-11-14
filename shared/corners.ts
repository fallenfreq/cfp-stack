// The CSS properties that set a box's corners, read by the Corners tool (to find a block's own
// corner size and take it off) and the validator (to point one out), so each finds the same ones
// (client/src/assets/sf-system.md, "Corners").
export const CORNER_PROPERTIES = [
	'border-radius',
	'border-top-left-radius',
	'border-top-right-radius',
	'border-bottom-right-radius',
	'border-bottom-left-radius',
	'border-start-start-radius',
	'border-start-end-radius',
	'border-end-start-radius',
	'border-end-end-radius',
] as const
