<template>
	<div ref="buttonEl" class="font-control">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>format_size</ToolbarIcon>
		</ToolbarButton>
		<ToolbarPanel :open="open" :anchor-el="buttonEl" align="right" @close="onClose">
			<FontPicker
				:font-family="currentFontFamily"
				:font-size="currentFontSize"
				:line-height="currentLineHeight"
				:letter-spacing="currentLetterSpacing"
				@commit="onCommit"
			/>
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import { useToolbarMarkControl } from '@/composables/editor/useToolbarMarkControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { getClassToken, setClassToken } from '@/utils/editor/classTokens'
import { nodeAt } from '@/utils/editor/editorUtils'
import { parseFontVar, type FontStyleAttrs } from '@/utils/editor/fontPalette'
import { setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import FontPicker from './FontPicker.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import ToolbarPanel from './ToolbarPanel.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const { open, buttonEl, capturedPos, mode, toggle, onClose, commitMark } =
	useToolbarMarkControl(props)

const markAttrs = computed(() =>
	mode.value === 'mark' ? props.editor.getAttributes('fontStyle') : {},
)

// Read node class token and convert to CSS var value for FontPicker
const classToVar = (cls: string, sfPrefix: string, cssVarPrefix: string): string | null => {
	const token = getClassToken(cls, sfPrefix)
	return token ? `var(${cssVarPrefix}${token})` : null
}

const nodeClass = computed(() => {
	if (mode.value !== 'node') return null
	const c = props.context.activeNode.attrs.class
	return typeof c === 'string' ? c : null
})

const currentFontFamily = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.fontFamily === 'string'
			? markAttrs.value.fontFamily
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-font-', '--font-')
			: null,
)

const currentFontSize = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.fontSize === 'string'
			? markAttrs.value.fontSize
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-text-', '--text-')
			: null,
)

const currentLineHeight = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.lineHeight === 'string'
			? markAttrs.value.lineHeight
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-leading-', '--leading-')
			: null,
)

const currentLetterSpacing = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.letterSpacing === 'string'
			? markAttrs.value.letterSpacing
			: null
		: nodeClass.value
			? classToVar(nodeClass.value, 'sf-tracking-', '--tracking-')
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
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	let cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	let s = typeof node.attrs.style === 'string' ? node.attrs.style : ''

	cls = setClassToken(cls, 'sf-font-', parseFontVar(fontFamily)?.slice('--font-'.length) ?? null)
	cls = setClassToken(cls, 'sf-text-', parseFontVar(fontSize)?.slice('--text-'.length) ?? null)
	cls = setClassToken(
		cls,
		'sf-leading-',
		parseFontVar(lineHeight)?.slice('--leading-'.length) ?? null,
	)
	cls = setClassToken(
		cls,
		'sf-tracking-',
		parseFontVar(letterSpacing)?.slice('--tracking-'.length) ?? null,
	)
	s = setStyleProp(s, 'font-family', null)
	s = setStyleProp(s, 'font-size', null)
	s = setStyleProp(s, 'line-height', null)
	s = setStyleProp(s, 'letter-spacing', null)

	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: cls || null,
			style: s || null,
		}),
	)
}
</script>

<style scoped>
.font-control {
	position: relative;
}
</style>
