<template>
	<ToolbarPanelItem :open="open" :tooltip="tooltip" align="right" @close="onClose">
		<template #trigger>
			<SfTooltip :text="tooltip">
				<Button class="sf-is-contained" @click="toggle">
					<span class="color-swatch" :style="swatchStyle" />
				</Button>
			</SfTooltip>
		</template>
		<ColorPicker :value="currentColor" @commit="onCommit" @remove="onRemove" />
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import { useToolbarMarkControl } from '@/composables/editor/useToolbarMarkControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { cssVarColor } from '@/utils/cssVarColor'
import { useAlphaPalette } from '@/utils/editor/alphaPalette'
import { getClassToken } from '@/utils/editor/classTokens'
import { useColorPalette } from '@/utils/editor/colorPalette'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { computed, type CSSProperties } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, capturedPos, mode, toggle, onClose, commitMark } = useToolbarMarkControl(props)
const { steps: alphaSteps, snapToStep } = useAlphaPalette()
const { parseStoredValue } = useColorPalette()

// Read background colour from sf-bg-* class tokens, falling back to inline style.
const readNodeBg = (node: { attrs: Record<string, unknown> }): string | null => {
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	const bgToken =
		cls
			.split(/\s+/)
			.find((c) => c.startsWith('sf-bg-') && !c.startsWith('sf-bg-alpha-'))
			?.slice('sf-bg-'.length) ?? null
	if (bgToken) {
		const alphaName = getClassToken(cls, 'sf-bg-alpha-')
		const alphaStep = alphaName
			? alphaSteps.value.find((s) => s.cssVar === `--sf-alpha-${alphaName}`)
			: null
		return cssVarColor(`--sf-${bgToken}`, alphaStep?.value ?? 1)
	}
	const style = typeof node.attrs.style === 'string' ? node.attrs.style : ''
	return getStyleProp(style, 'background-color') || null
}

const currentColor = computed<string | null>(() => {
	if (mode.value === 'mark') {
		const color = props.editor.getAttributes('textColor').color
		return typeof color === 'string' ? color : null
	}
	return readNodeBg(props.context.activeNode)
})

const NO_COLOR_STRIPE =
	'linear-gradient(45deg, transparent 45%, rgba(var(--danger) / var(--sf-alpha-6)) 45%, rgba(var(--danger) / var(--sf-alpha-6)) 55%, transparent 55%)'

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
	let cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	let s = typeof node.attrs.style === 'string' ? node.attrs.style : ''

	// Clear all existing bg colour and alpha classes, and inline background-color.
	cls = cls
		.split(/\s+/)
		.filter((c) => !c.startsWith('sf-bg-'))
		.join(' ')
	s = setStyleProp(s, 'background-color', null)

	if (value !== null) {
		const parsed = parseStoredValue(value)
		if (parsed?.kind === 'token') {
			cls = (cls + ` sf-bg-${parsed.cssVar.slice('--sf-'.length)}`).trim()
			if (parsed.alpha < 1) {
				const step = snapToStep(parsed.alpha)
				if (step) {
					cls = (cls + ` sf-bg-alpha-${step.cssVar.slice('--sf-alpha-'.length)}`).trim()
				}
			}
		} else {
			// Arbitrary colour: store as inline style
			s = setStyleProp(s, 'background-color', value)
		}
	}

	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: cls || null,
			style: s || null,
		}),
	)
}

const onCommit = (value: string) => applyColor(value)
const onRemove = () => applyColor(null)
</script>

<style scoped>
.color-swatch {
	display: inline-block;
	width: 16px;
	height: 16px;
	border-radius: 3px;
	border: 1px solid rgba(var(--text_primary) / var(--sf-alpha-3));
}
</style>
