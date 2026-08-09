<template>
	<ToolbarPanelItem
		icon="aspect_ratio"
		:tooltip="tooltip"
		:open="open"
		align="right"
		@toggle="toggle"
		@close="onClose"
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
import { getClassToken, setClassToken } from '@/utils/editor/classTokens'
import { nodeAt } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'
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

const { open, capturedPos, toggle, onClose } = useToolbarNodeControl(props)

const selectedAspect = ref<string | null>(null)
const selectedObject = ref<string | null>(null)

watch(open, (isOpen) => {
	if (!isOpen || capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	selectedAspect.value = getClassToken(cls, 'sl-aspect-')
	selectedObject.value = getClassToken(cls, 'sl-object-')
})

const commit = (cls: string) => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: cls || null,
		}),
	)
}

const selectAspect = (value: string) => {
	const next = selectedAspect.value === value ? null : value
	selectedAspect.value = next
	const node = nodeAt(props.editor.state.doc, capturedPos.value!)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	commit(setClassToken(cls, 'sl-aspect-', next))
}

const selectObject = (value: string) => {
	const next = selectedObject.value === value ? null : value
	selectedObject.value = next
	const node = nodeAt(props.editor.state.doc, capturedPos.value!)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	commit(setClassToken(cls, 'sl-object-', next))
}
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
