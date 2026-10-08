import { editorComponents } from '@/config/editor/editorComponents'
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

	// Keyed by the block's type in the editor: a component block's is its ID.
	const specs = computed<Record<string, ClassTokenSpec[]>>(() => ({
		[editorComponents.LayoutCard.uuid]: [
			{ key: 'radius', prefix: 'sf-radius-', options: radiusOptions.value, default: null },
			{ key: 'padding', prefix: 'sf-padding-', options: spacingOptions.value, default: null },
		],
		[editorComponents.LayoutStack.uuid]: [
			{ key: 'gap', prefix: 'sf-gap-', options: spacingOptions.value, default: null },
			{ key: 'padding', prefix: 'sf-padding-', options: spacingOptions.value, default: null },
		],
		[editorComponents.LayoutColumns.uuid]: [
			{ key: 'gap', prefix: 'sf-gap-', options: spacingOptions.value, default: null },
			{
				key: 'collapse',
				prefix: 'sl-collapse-',
				options: breakpointOptions.value,
				default: null,
			},
		],
		[editorComponents.LayoutCenter.uuid]: [
			{ key: 'gap', prefix: 'sf-gap-', options: spacingOptions.value, default: null },
			{ key: 'padding', prefix: 'sf-padding-', options: spacingOptions.value, default: null },
		],
		[editorComponents.LayoutSplit.uuid]: [
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
