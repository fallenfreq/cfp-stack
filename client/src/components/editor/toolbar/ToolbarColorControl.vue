<template>
	<div ref="buttonEl" class="color-control">
		<ToolbarButton @click="toggle">
			<span class="color-swatch" :style="swatchStyle" />
		</ToolbarButton>
		<ToolbarPanel :open="open" :anchor-el="buttonEl" align="right" @close="onClose">
			<ColorPicker :value="currentColor" @commit="onCommit" />
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import { TextSelection } from '@tiptap/pm/state'
import { getMarkRange, type Editor } from '@tiptap/vue-3'
import { computed, nextTick, ref, watch, type CSSProperties } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarPanel from './ToolbarPanel.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const open = ref(false)
const buttonEl = ref<HTMLElement | null>(null)
const capturedPos = ref<NodePos | null>(null)
const savedRange = ref<{ from: number; to: number } | null>(null)

// Mark mode: user has a text range selected inside a textblock (not codeBlock).
// Node mode: a block node is active — colour its background instead.
// We touch props.context so Vue re-runs this on every toolbar tick (transactions).
const mode = computed<'mark' | 'node'>(() => {
	void props.context
	const sel = props.editor.state.selection
	if (
		sel instanceof TextSelection
		&& sel.from !== sel.to
		&& sel.$from.parent.type.isTextblock
		&& sel.$from.parent.type.name !== 'codeBlock'
	)
		return 'mark'
	return 'node'
})

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
	'linear-gradient(45deg, transparent 45%, rgba(var(--danger) / 0.6) 45%, rgba(var(--danger) / 0.6) 55%, transparent 55%)'

const swatchStyle = computed<CSSProperties>(() =>
	currentColor.value
		? { backgroundColor: currentColor.value }
		: { backgroundImage: NO_COLOR_STRIPE },
)

const toggle = () => {
	if (open.value) {
		onClose()
		return
	}
	const { from, to } = props.editor.state.selection
	savedRange.value = { from, to }
	capturedPos.value = props.context.nodePos
	open.value = true
}

const onClose = () => {
	open.value = false
	nextTick(() => {
		capturedPos.value = null
		savedRange.value = null
	})
}

const onCommit = (value: string | null) => {
	if (mode.value === 'mark') {
		const range = savedRange.value
		if (!range) return
		const editor = props.editor
		const markType = editor.schema.marks.textColor
		if (!markType) return

		let from = range.from
		let to = range.to
		if (from === to) {
			const markRange = getMarkRange(editor.state.doc.resolve(from), markType)
			if (!markRange) return
			from = markRange.from
			to = markRange.to
		}

		let tr = editor.state.tr.removeMark(from, to, markType)
		if (value) tr = tr.addMark(from, to, markType.create({ color: value }))
		tr = tr.setSelection(TextSelection.create(tr.doc, from, to))
		editor.view.dispatch(tr)
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

watch(
	() => props.context.nodePos,
	(nodePos) => {
		if (!open.value || capturedPos.value === null) return
		if (nodePos !== capturedPos.value) onClose()
	},
)
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
	border: 1px solid rgba(var(--textPrimary) / 0.3);
}
</style>
