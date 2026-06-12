import cssVariables from '@/../cssVariables'

export interface AlphaStep {
	cssVar: string // e.g. '--alpha-50'
	value: number // 0..1
	label: string // e.g. '50%'
}

// Only the curated round-number steps appear in the picker; fine-grained bridge values
// (6, 8, 12, 35 …) exist in base.css for component styles but would make the slider
// unwieldy, so they are filtered out here.
const PICKER_STEPS = new Set([0, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100])
const NUMERIC_ALPHA = /^--alpha-(\d+)$/

export const ALPHA_STEPS: AlphaStep[] = (() => {
	const steps: AlphaStep[] = []
	for (const [cssVar, raw] of Object.entries(cssVariables.root)) {
		const m = cssVar.match(NUMERIC_ALPHA)
		if (!m || !PICKER_STEPS.has(Number(m[1]))) continue
		const value = Number(raw)
		if (isNaN(value)) continue
		steps.push({ cssVar, value, label: `${Math.round(value * 100)}%` })
	}
	return steps.sort((a, b) => a.value - b.value)
})()

const FALLBACK_STEP: AlphaStep = { cssVar: '--alpha-100', value: 1, label: '100%' }

export const snapToStep = (alpha: number): AlphaStep =>
	ALPHA_STEPS.length === 0
		? FALLBACK_STEP
		: ALPHA_STEPS.reduce((best, s) =>
				Math.abs(s.value - alpha) < Math.abs(best.value - alpha) ? s : best,
			)
