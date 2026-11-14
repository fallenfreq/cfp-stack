<template>
	<ToolbarPanelItem :open="open" :tooltip="tooltip" align="end" @update:open="setOpen">
		<template #trigger="trigger">
			<ToolbarButton v-bind="trigger" :tooltip="tooltip">
				<span class="color-swatch sf-swatch sf-size-2xs" :style="swatchStyle" />
			</ToolbarButton>
		</template>
		<ColorPicker
			:value="current.theme"
			:fixed="current.fixed !== null"
			@commit="applyColor"
			@remove="applyColor(null)"
		/>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import { useToolbarMarkControl } from '@/composables/editor/useToolbarMarkControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import {
	readThemeColor,
	swatchColor,
	type ThemeColor,
	themeColorClasses,
} from '@/utils/editor/colorPalette'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { computed, type CSSProperties } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, capturedPos, mode, setOpen, commitMark } = useToolbarMarkControl(props)

const text = (value: unknown) => (typeof value === 'string' && value ? value : null)

// The colour applied: text's (its textColor mark), or a block's background (its sf-bg-* classes,
// or a background-color in its own style).
const current = computed<{ theme: ThemeColor | null; fixed: string | null }>(() => {
	if (mode.value === 'mark') {
		const attrs = props.editor.getAttributes('textColor')
		const color = text(attrs['color'])
		return {
			theme: color ? { color, alpha: text(attrs['alpha']) } : null,
			fixed: text(attrs['fixed']),
		}
	}
	const { attrs } = props.context.activeNode
	return {
		theme: readThemeColor(text(attrs['class']) ?? '', 'sf-bg-', 'sf-bg-alpha-'),
		fixed: getStyleProp(text(attrs['style']) ?? '', 'background-color') || null,
	}
})

const NO_COLOR_STRIPE =
	'linear-gradient(45deg, transparent 45%, rgba(var(--sf-danger) / var(--sf-alpha-6)) 45%, rgba(var(--sf-danger) / var(--sf-alpha-6)) 55%, transparent 55%)'

const swatchStyle = computed<CSSProperties>(() => {
	// A fixed colour shows over a theme one, on the page as here.
	const { theme, fixed } = current.value
	if (fixed) return { backgroundColor: fixed }
	if (theme) return { backgroundColor: swatchColor(theme) }
	return { backgroundImage: NO_COLOR_STRIPE }
})

// A theme colour picked replaces whatever colour was there, a fixed one included; null removes it.
const applyColor = (value: ThemeColor | null) => {
	if (mode.value === 'mark') {
		commitMark('textColor', value ? { ...value } : null)
		return
	}
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const classes = (text(node.attrs['class']) ?? '')
		.split(/\s+/)
		.filter((c) => c && !c.startsWith('sf-bg-'))
	if (value) classes.push(...themeColorClasses(value, 'sf-bg-', 'sf-bg-alpha-'))
	const style = setStyleProp(text(node.attrs['style']) ?? '', 'background-color', null)

	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: classes.join(' ') || null,
			style: style || null,
		}),
	)
}
</script>

<style scoped>
.color-swatch {
	width: 16px;
	height: 16px;
}
</style>
