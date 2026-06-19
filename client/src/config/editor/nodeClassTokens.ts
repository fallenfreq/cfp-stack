import { useLayoutTokens } from '@/config/editor/layoutTokens'
import { computed } from 'vue'

export interface ClassTokenSpec {
	key: string
	prefix: string
	options: readonly string[]
	default: string | null
}

export function useNodeClassTokens() {
	const { radiusOptions, spacingOptions, breakpointOptions } = useLayoutTokens()

	const specs = computed<Record<string, ClassTokenSpec[]>>(() => ({
		LayoutCard: [
			{ key: 'radius', prefix: 'sf-radius-', options: radiusOptions.value, default: null },
			{ key: 'padding', prefix: 'sf-padding-', options: spacingOptions.value, default: null },
		],
		LayoutSection: [
			{ key: 'gap', prefix: 'sf-gap-', options: spacingOptions.value, default: null },
			{ key: 'padding', prefix: 'sf-padding-', options: spacingOptions.value, default: null },
		],
		LayoutColumns: [
			{ key: 'gap', prefix: 'sf-gap-', options: spacingOptions.value, default: null },
			{
				key: 'collapse',
				prefix: 'sl-collapse-',
				options: breakpointOptions.value,
				default: null,
			},
		],
		LayoutCenter: [
			{ key: 'gap', prefix: 'sf-gap-', options: spacingOptions.value, default: null },
			{ key: 'padding', prefix: 'sf-padding-', options: spacingOptions.value, default: null },
		],
		LayoutSplit: [
			{ key: 'gap', prefix: 'sf-gap-', options: spacingOptions.value, default: null },
			{
				key: 'collapse',
				prefix: 'sl-collapse-',
				options: breakpointOptions.value,
				default: null,
			},
		],
		image: [
			{ key: 'radius', prefix: 'sf-radius-', options: radiusOptions.value, default: null },
		],
	}))

	return { specs }
}
