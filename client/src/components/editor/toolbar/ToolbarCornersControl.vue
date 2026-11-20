<template>
	<ToolbarPanelItem
		icon="rounded_corner"
		:tooltip="tooltip"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<ToolbarSizeChips
			:label="themeSize ? 'Corners' : 'Not a theme size'"
			:options="radiusOptions"
			:value="size"
			:own-size="ownSize"
			@mousedown.stop
			@pick="pick"
		/>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import { useLayoutTokens } from '@/config/editor/layoutTokens'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { getClassToken } from '@/utils/editor/classTokens'
import { getStyleProp } from '@/utils/editor/styleString'
import { CORNER_PROPERTIES } from '@somefreq-app/shared/corners'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'
import ToolbarSizeChips from './ToolbarSizeChips.vue'

// The theme's sizes only (client/src/assets/sf-system.md, "Corners"): a size of the block's own,
// from a paste or the code view, is kept until a pick replaces it.

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, setOpen, blockClass, blockStyle, updateBlockLook } = useToolbarNodeControl(props)
const { radiusOptions } = useLayoutTokens()

// The size class the block wears (`sf-radius-2` → '2'), or null for none.
const size = computed(() => getClassToken(blockClass.value, 'sf-radius-'))
// The block's own style sets a corner, which shows over the class.
const ownSize = computed(() =>
	CORNER_PROPERTIES.some((property) => getStyleProp(blockStyle.value, property)),
)

const themeSize = computed(
	() => !ownSize.value && (size.value === null || radiusOptions.value.includes(size.value)),
)

// A size picked, or none, replaces the block's own corners too.
const pick = (picked: string | null) =>
	updateBlockLook({
		replacing: (name) => name.startsWith('sf-radius-'),
		classes: picked === null ? [] : [`sf-radius-${picked}`],
		style: Object.fromEntries(CORNER_PROPERTIES.map((property) => [property, null])),
	})
</script>
