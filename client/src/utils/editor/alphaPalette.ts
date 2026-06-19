import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { computed } from 'vue'

export interface AlphaStep {
	cssVar: string // e.g. '--sf-alpha-3'
	value: number // 0..1
	label: string // e.g. '30%'
}

const SF_ALPHA = /^--sf-alpha-(\d+)$/

export function useAlphaPalette() {
	const store = useThemeTokensStore()

	const steps = computed<AlphaStep[]>(() => {
		const out: AlphaStep[] = []
		for (const tk of store.rootTokens) {
			if (!SF_ALPHA.test(tk.name)) continue
			const value = Number(tk.value)
			if (isNaN(value)) continue
			out.push({ cssVar: tk.name, value, label: `${Math.round(value * 100)}%` })
		}
		return out.sort((a, b) => a.value - b.value)
	})

	// Nearest step to `alpha`, or null when no steps exist (degenerate theme).
	function snapToStep(alpha: number): AlphaStep | null {
		const list = steps.value
		if (list.length === 0) return null
		return list.reduce((best, s) =>
			Math.abs(s.value - alpha) < Math.abs(best.value - alpha) ? s : best,
		)
	}

	return { steps, snapToStep }
}
