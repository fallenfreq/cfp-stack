<template>
	<ToolbarPanelItem
		icon="format_size"
		:tooltip="tooltip"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<FontPicker
			:font-family="currentFontFamily"
			:font-size="currentFontSize"
			:line-height="currentLineHeight"
			:letter-spacing="currentLetterSpacing"
			@commit="onCommit"
		/>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import { useToolbarMarkControl } from '@/composables/editor/useToolbarMarkControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { getClassToken } from '@/utils/editor/classTokens'
import { parseFontVar, type FontStyleAttrs } from '@/utils/editor/fontPalette'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import FontPicker from './FontPicker.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, mode, setOpen, commitMark, blockClass, updateBlockLook } =
	useToolbarMarkControl(props)

const markAttrs = computed(() =>
	mode.value === 'mark' ? props.editor.getAttributes('fontStyle') : {},
)

// Read node class token and convert to CSS var value for FontPicker
const classToVar = (cls: string, sfPrefix: string, cssVarPrefix: string): string | null => {
	const token = getClassToken(cls, sfPrefix)
	return token ? `var(${cssVarPrefix}${token})` : null
}

const nodeClass = computed(() => (mode.value === 'node' ? blockClass.value : null))

const currentFontFamily = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value['fontFamily'] === 'string'
			? markAttrs.value['fontFamily']
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-font-', '--sf-font-')
			: null,
)

const currentFontSize = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value['fontSize'] === 'string'
			? markAttrs.value['fontSize']
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-text-', '--sf-text-')
			: null,
)

const currentLineHeight = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value['lineHeight'] === 'string'
			? markAttrs.value['lineHeight']
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-leading-', '--sf-leading-')
			: null,
)

const currentLetterSpacing = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value['letterSpacing'] === 'string'
			? markAttrs.value['letterSpacing']
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-tracking-', '--sf-tracking-')
			: null,
)

const onCommit = ({ fontFamily, fontSize, lineHeight, letterSpacing }: FontStyleAttrs) => {
	if (mode.value === 'mark') {
		commitMark(
			'fontStyle',
			fontFamily || fontSize || lineHeight || letterSpacing
				? { fontFamily, fontSize, lineHeight, letterSpacing }
				: null,
		)
		return
	}
	// A theme value becomes its class (`var(--sf-text-lg)` → `sf-text-lg`); the block's own font
	// settings go.
	const themeClass = (value: string | null, prefix: string) => {
		const name = parseFontVar(value)
		return name?.startsWith(`--${prefix}`) ? [name.slice(2)] : []
	}
	updateBlockLook({
		replacing: ['sf-font-', 'sf-text-', 'sf-leading-', 'sf-tracking-'],
		classes: [
			...themeClass(fontFamily, 'sf-font-'),
			...themeClass(fontSize, 'sf-text-'),
			...themeClass(lineHeight, 'sf-leading-'),
			...themeClass(letterSpacing, 'sf-tracking-'),
		],
		style: {
			'font-family': null,
			'font-size': null,
			'line-height': null,
			'letter-spacing': null,
		},
	})
}
</script>
