<template>
	<div ref="buttonEl" class="color-control">
		<ToolbarButton @click="toggle">
			<span class="color-swatch" :style="swatchStyle" />
		</ToolbarButton>
		<ToolbarPanel :open="open" :anchor-el="buttonEl" align="right" @close="onClose">
			<ColorPicker :value="currentColor" @commit="onCommit" @remove="onRemove" />
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import { useToolbarMarkControl } from '@/composables/editor/useToolbarMarkControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { computed, type CSSProperties } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarPanel from './ToolbarPanel.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const { open, buttonEl, capturedPos, mode, toggle, onClose, commitMark } =
	useToolbarMarkControl(props)

const currentColor = computed<string | null>(() => {
	if (mode.value === 'mark') {
		const color = props.editor.getAttributes('textColor').color
		return typeof color === 'string' ? color : null
	}
	const styleAttr = props.context.activeNode.attrs.style
	if (typeof styleAttr !== 'string') return null
	return getStyleProp(styleAttr, 'background-color') || null
})

const NO_COLOR_STRIPE =
	'linear-gradient(45deg, transparent 45%, rgba(var(--danger) / var(--alpha-60)) 45%, rgba(var(--danger) / var(--alpha-60)) 55%, transparent 55%)'

const swatchStyle = computed<CSSProperties>(() =>
	currentColor.value
		? { backgroundColor: currentColor.value }
		: { backgroundImage: NO_COLOR_STRIPE },
)

const applyColor = (value: string | null) => {
	if (mode.value === 'mark') {
		commitMark('textColor', value ? { color: value } : null)
		return
	}
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const currentStyle = typeof node.attrs.style === 'string' ? node.attrs.style : ''
	const newStyle = setStyleProp(currentStyle, 'background-color', value)
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			style: newStyle || null,
		}),
	)
}

const onCommit = (value: string) => applyColor(value)
const onRemove = () => applyColor(null)
</script>

<style scoped>
.color-control {
	position: relative;
}

.color-swatch {
	display: inline-block;
	width: 16px;
	height: 16px;
	border-radius: 3px;
	border: 1px solid rgba(var(--textPrimary) / var(--alpha-30));
}
</style>
