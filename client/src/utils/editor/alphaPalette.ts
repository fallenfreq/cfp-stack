import cssVariables from '@/../cssVariables'

export interface AlphaStep {
	cssVar: string // e.g. '--sf-alpha-3'
	value: number // 0..1
	label: string // e.g. '30%'
}

const SF_ALPHA = /^--sf-alpha-(\d+)$/

export const ALPHA_STEPS: AlphaStep[] = (() => {
	const steps: AlphaStep[] = []
	for (const [cssVar, raw] of Object.entries(cssVariables.root)) {
		if (!SF_ALPHA.test(cssVar)) continue
		const value = Number(raw)
		if (isNaN(value)) continue
		steps.push({ cssVar, value, label: `${Math.round(value * 100)}%` })
	}
	return steps.sort((a, b) => a.value - b.value)
})()

// Returns the nearest step to the given alpha, or null if no steps exist
// (degenerate build — caller should skip emitting an alpha class).
export const snapToStep = (alpha: number): AlphaStep | null =>
	ALPHA_STEPS.length === 0
		? null
		: ALPHA_STEPS.reduce((best, s) =>
				Math.abs(s.value - alpha) < Math.abs(best.value - alpha) ? s : best,
			)
