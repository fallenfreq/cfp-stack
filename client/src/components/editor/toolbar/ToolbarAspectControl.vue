<template>
	<ToolbarPanelItem
		icon="aspect_ratio"
		:tooltip="tooltip"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<div class="aspect-picker" @mousedown.stop>
			<span class="ap-label sf-loudness-1">Aspect ratio</span>
			<div class="ap-row">
				<SfChip
					v-for="opt in aspectOptions"
					:key="opt.value"
					size="xs"
					:selected="selectedAspect === opt.value"
					@mousedown.prevent
					@click="selectAspect(opt.value)"
				>
					{{ opt.label }}
				</SfChip>
			</div>

			<span class="ap-label sf-loudness-1">Image fill</span>
			<div class="ap-row">
				<SfChip
					v-for="opt in objectOptions"
					:key="opt.value"
					size="xs"
					:selected="selectedObject === opt.value"
					@mousedown.prevent
					@click="selectObject(opt.value)"
				>
					{{ opt.label }}
				</SfChip>
			</div>
		</div>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import SfChip from '@/components/SfChip.vue'
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { getClassToken } from '@/utils/editor/classTokens'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const aspectOptions = [
	{ label: '16:9', value: '16-9' },
	{ label: '4:3', value: '4-3' },
	{ label: '1:1', value: '1-1' },
	{ label: '9:16', value: '9-16' },
] as const

const objectOptions = [
	{ label: 'Cover', value: 'cover' },
	{ label: 'Contain', value: 'contain' },
	{ label: 'Stretch', value: 'fill' },
	{ label: 'Original', value: 'none' },
] as const

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, setOpen, blockClass, updateBlockLook } = useToolbarNodeControl(props)

const selectedAspect = computed(() => getClassToken(blockClass.value, 'sl-aspect-'))
const selectedObject = computed(() => getClassToken(blockClass.value, 'sl-object-'))

// The chosen chip picked again takes it off.
const select = (prefix: string, chosen: string | null, value: string) =>
	updateBlockLook({
		replacing: (name) => name.startsWith(prefix),
		classes: chosen === value ? [] : [prefix + value],
	})
const selectAspect = (value: string) => select('sl-aspect-', selectedAspect.value, value)
const selectObject = (value: string) => select('sl-object-', selectedObject.value, value)
</script>

<style scoped>
@layer ui {
	.aspect-picker {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	.ap-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}
}
</style>
