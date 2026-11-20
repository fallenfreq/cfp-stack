<template>
	<ToolbarPanelItem
		icon="format_size"
		:tooltip="tooltip"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<FontPicker
			:font-family="current.fontFamily"
			:font-size="current.fontSize"
			:line-height="current.lineHeight"
			:letter-spacing="current.letterSpacing"
			@commit="onCommit"
		/>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import { useToolbarMarkControl } from '@/composables/editor/useToolbarMarkControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { FONT_SETTINGS, type FontLooks, type FontSetting } from '@/utils/editor/fontPalette'
import { LOOKS, lookClass, looksIn, readLook } from '@somefreq-app/shared/textLooks'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import FontPicker from './FontPicker.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, mode, setOpen, commitLooks, blockClass, updateBlockLook } =
	useToolbarMarkControl(props)

const fontLooks = (look: (setting: FontSetting) => unknown): FontLooks => {
	const name = (setting: FontSetting) => {
		const value = look(setting)
		return typeof value === 'string' && value ? value : null
	}
	return {
		fontFamily: name('fontFamily'),
		fontSize: name('fontSize'),
		lineHeight: name('lineHeight'),
		letterSpacing: name('letterSpacing'),
	}
}

// The font looks applied: text's (its text style mark), or a block's classes.
const current = computed<FontLooks>(() => {
	if (mode.value === 'mark') {
		const attrs = props.editor.getAttributes('textStyle')
		return fontLooks((setting) => attrs[setting])
	}
	const looks = looksIn(blockClass.value)
	return fontLooks((setting) => looks[setting])
})

// A pick replaces its own looks and the properties they set in the style, the text's or the
// block's own, keeping the others.
const onCommit = (looks: Partial<FontLooks>) => {
	if (mode.value === 'mark') {
		commitLooks(looks)
		return
	}
	const picked = FONT_SETTINGS.filter((setting) => setting in looks)
	updateBlockLook({
		replacing: (className) =>
			picked.some((setting) => setting === readLook(className)?.setting),
		classes: picked.flatMap((setting) => {
			const name = looks[setting]
			return name ? [lookClass(setting, name)] : []
		}),
		style: Object.fromEntries(picked.map((setting) => [LOOKS[setting].property, null])),
	})
}
</script>
