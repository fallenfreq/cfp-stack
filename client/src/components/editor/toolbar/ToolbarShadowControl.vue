<template>
	<ToolbarPanelItem
		icon="shadow"
		:tooltip="tooltip"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<div class="sp-picker sf-divide-y" @mousedown.stop>
			<div class="sp-section">
				<span class="sp-label sf-loudness-1">Shadow</span>
				<div class="sp-row">
					<SfChip
						size="xs"
						:selected="selectedToken === null"
						@mousedown.prevent
						@click="selectToken(null)"
					>
						none
					</SfChip>
					<SfChip
						v-for="t in shadowOptions"
						:key="t"
						size="xs"
						:selected="selectedToken === t"
						@mousedown.prevent
						@click="selectToken(t)"
					>
						{{ t }}
					</SfChip>
				</div>
			</div>

			<ColorPicker
				v-if="selectedToken !== null"
				:value="shadowColor"
				:fixed="fixedColor !== null"
				none-label="Theme shadow"
				@commit="onColorCommit"
				@remove="onColorCommit(null)"
			/>
		</div>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import SfChip from '@/components/SfChip.vue'
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import { useLayoutTokens } from '@/config/editor/layoutTokens'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { readThemeColor, type ThemeColor, themeColorClasses } from '@/utils/editor/colorPalette'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, capturedPos, setOpen } = useToolbarNodeControl(props)
const { shadowOptions } = useLayoutTokens()

// null = no shadow; string = token name from shadowOptions
const selectedToken = ref<string | null>(null)
// The theme colour picked, or null for none: the theme's own shadow colour.
const shadowColor = ref<ThemeColor | null>(null)
// A colour not from the theme in the block's own style (`--sf-shadow-color`), kept as written.
const fixedColor = ref<string | null>(null)

const text = (value: unknown) => (typeof value === 'string' ? value : '')

// Shape lives on `sf-shadow-<size>`; exclude the color/alpha siblings.
const readShape = (cls: string): string | null => {
	for (const c of cls.split(/\s+/)) {
		if (!c.startsWith('sf-shadow-')) continue
		if (c.startsWith('sf-shadow-color-') || c.startsWith('sf-shadow-alpha-')) continue
		return c.slice('sf-shadow-'.length)
	}
	return null
}

watch(open, (isOpen) => {
	if (!isOpen || capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls = text(node.attrs['class'])
	const shape = readShape(cls)
	selectedToken.value = shape !== null && shadowOptions.value.includes(shape) ? shape : null
	// Read apart, as a block can have both; only a colour picked, or none, replaces a fixed one.
	shadowColor.value = readThemeColor(cls, 'sf-shadow-color-', 'sf-shadow-alpha-')
	fixedColor.value = getStyleProp(text(node.attrs['style']), '--sf-shadow-color') || null
})

const selectToken = (token: string | null) => {
	selectedToken.value = token
	commit()
}

// A theme colour picked, or none, replaces a fixed one.
const onColorCommit = (color: ThemeColor | null) => {
	shadowColor.value = color
	fixedColor.value = null
	commit()
}

const commit = () => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)

	// Strip every sf-shadow-* class and any --sf-shadow-color; the selection is added back.
	const classes = text(node.attrs['class'])
		.split(/\s+/)
		.filter((c) => c && !c.startsWith('sf-shadow-'))
	let style = setStyleProp(text(node.attrs['style']), '--sf-shadow-color', null)

	if (selectedToken.value !== null) {
		classes.push(`sf-shadow-${selectedToken.value}`)
		if (shadowColor.value)
			classes.push(
				...themeColorClasses(shadowColor.value, 'sf-shadow-color-', 'sf-shadow-alpha-'),
			)
		if (fixedColor.value) style = setStyleProp(style, '--sf-shadow-color', fixedColor.value)
	}

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
@layer ui {
	.sp-picker {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-xs));
	}

	.sp-section {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	.sp-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		flex-wrap: wrap;
	}
}
</style>
