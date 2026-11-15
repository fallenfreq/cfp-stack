<template>
	<ToolbarPanelItem
		icon="shadow"
		:tooltip="tooltip"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<div class="sp-picker sf-divide-y" @mousedown.stop>
			<ToolbarSizeChips
				label="Shadow"
				:options="shadowOptions"
				:value="selectedToken"
				@pick="selectToken"
			/>

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
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import { useLayoutTokens } from '@/config/editor/layoutTokens'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { readThemeColor, type ThemeColor, themeColorClasses } from '@/utils/editor/colorPalette'
import { getStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import ColorPicker from './ColorPicker.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'
import ToolbarSizeChips from './ToolbarSizeChips.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, setOpen, blockClass, blockStyle, updateBlockLook } = useToolbarNodeControl(props)
const { shadowOptions } = useLayoutTokens()

// Shape lives on `sf-shadow-<size>`; exclude the color/alpha siblings.
const readShape = (cls: string): string | null => {
	for (const c of cls.split(/\s+/)) {
		if (!c.startsWith('sf-shadow-')) continue
		if (c.startsWith('sf-shadow-color-') || c.startsWith('sf-shadow-alpha-')) continue
		return c.slice('sf-shadow-'.length)
	}
	return null
}

// The theme size the block wears, or null for none.
const selectedToken = computed(() => {
	const shape = readShape(blockClass.value)
	return shape !== null && shadowOptions.value.includes(shape) ? shape : null
})
// Read apart, as a block can have both; only a colour picked, or none, replaces a fixed one.
// The theme colour, or null for the theme's own shadow colour.
const shadowColor = computed(() =>
	readThemeColor(blockClass.value, 'sf-shadow-color-', 'sf-shadow-alpha-'),
)
// A colour not from the theme in the block's own style (`--sf-shadow-color`), kept as written.
const fixedColor = computed(() => getStyleProp(blockStyle.value, '--sf-shadow-color') || null)

const selectToken = (token: string | null) => commit(token, shadowColor.value, fixedColor.value)
// A theme colour picked, or none, replaces a fixed one.
const onColorCommit = (color: ThemeColor | null) => commit(selectedToken.value, color, null)

// Every sf-shadow-* class gives way to the picks; a fixed colour goes with the size.
const commit = (token: string | null, color: ThemeColor | null, fixed: string | null) =>
	updateBlockLook({
		replacing: ['sf-shadow-'],
		classes:
			token === null
				? []
				: [
						`sf-shadow-${token}`,
						...(color
							? themeColorClasses(color, 'sf-shadow-color-', 'sf-shadow-alpha-')
							: []),
					],
		style: { '--sf-shadow-color': token === null ? null : fixed },
	})
</script>

<style scoped>
@layer ui {
	.sp-picker {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-xs));
	}
}
</style>
