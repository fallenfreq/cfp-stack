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
import { getClassToken, setClassToken } from '@/utils/editor/classTokens'
import { nodeAt } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import { CORNER_PROPERTIES } from '@somefreq-app/shared/corners'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref, watch } from 'vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'
import ToolbarSizeChips from './ToolbarSizeChips.vue'

// The theme's sizes only (client/src/assets/sf-system.md, "Corners"): a size of the block's own,
// from a paste or the code view, is kept until a pick replaces it.

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, capturedPos, setOpen } = useToolbarNodeControl(props)
const { radiusOptions } = useLayoutTokens()

// The size class the block wears (`sf-radius-2` → '2'), or null for none.
const size = ref<string | null>(null)
// The block's own style sets a corner, which shows over the class.
const ownSize = ref(false)

const themeSize = computed(
	() => !ownSize.value && (size.value === null || radiusOptions.value.includes(size.value)),
)

const text = (value: unknown) => (typeof value === 'string' ? value : '')

watch(open, (isOpen) => {
	if (!isOpen || capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const style = text(node.attrs['style'])
	size.value = getClassToken(text(node.attrs['class']), 'sf-radius-')
	ownSize.value = CORNER_PROPERTIES.some((property) => getStyleProp(style, property))
})

// A size picked, or none, replaces the block's own corners too.
const pick = (picked: string | null) => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const style = CORNER_PROPERTIES.reduce(
		(s, property) => setStyleProp(s, property, null),
		text(node.attrs['style']),
	)
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: setClassToken(text(node.attrs['class']), 'sf-radius-', picked) || null,
			style: style || null,
		}),
	)
	size.value = picked
	ownSize.value = false
}
</script>
