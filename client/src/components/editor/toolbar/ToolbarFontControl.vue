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
import { nodeAt } from '@/utils/editor/editorUtils'
import type { FontStyleAttrs } from '@/utils/editor/fontPalette'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
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

const nodeStyle = computed(() => {
	if (mode.value !== 'node') return null
	const s = props.context.activeNode.attrs.style
	return typeof s === 'string' ? s : null
})

const currentFontFamily = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.fontFamily === 'string'
			? markAttrs.value.fontFamily
			: null
		: nodeStyle.value
			? getStyleProp(nodeStyle.value, 'font-family') || null
			: null,
)

const currentFontSize = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.fontSize === 'string'
			? markAttrs.value.fontSize
			: null
		: nodeStyle.value
			? getStyleProp(nodeStyle.value, 'font-size') || null
			: null,
)

const currentLineHeight = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.lineHeight === 'string'
			? markAttrs.value.lineHeight
			: null
		: nodeStyle.value
			? getStyleProp(nodeStyle.value, 'line-height') || null
			: null,
)

const currentLetterSpacing = computed<string | null>(() =>
	mode.value === 'mark'
		? typeof markAttrs.value.letterSpacing === 'string'
			? markAttrs.value.letterSpacing
			: null
		: nodeStyle.value
			? getStyleProp(nodeStyle.value, 'letter-spacing') || null
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
	const base = typeof node.attrs.style === 'string' ? node.attrs.style : ''
	let newStyle = setStyleProp(base, 'font-family', fontFamily)
	newStyle = setStyleProp(newStyle, 'font-size', fontSize)
	newStyle = setStyleProp(newStyle, 'line-height', lineHeight)
	newStyle = setStyleProp(newStyle, 'letter-spacing', letterSpacing)
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			style: newStyle || null,
		}),
	)
}
</script>

<style scoped>
.font-control {
	position: relative;
}
</style>
