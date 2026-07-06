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
			<span class="ap-label">Aspect ratio</span>
			<div class="ap-row">
				<button
					v-for="opt in options"
					:key="opt.value"
					class="ap-chip"
					:class="{ 'sf-on-selected': selectedToken === opt.value }"
					@mousedown.prevent
					@click="selectToken(opt.value)"
				>
					{{ opt.label }}
				</button>
			</div>
		</div>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { getClassToken, setClassToken } from '@/utils/editor/classTokens'
import { nodeAt } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const options = [
	{ label: '16:9', value: '16-9' },
	{ label: '4:3', value: '4-3' },
	{ label: '1:1', value: '1-1' },
	{ label: '9:16', value: '9-16' },
] as const

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, capturedPos, toggle, onClose } = useToolbarNodeControl(props)

const selectedToken = ref<string | null>(null)

watch(open, (isOpen) => {
	if (!isOpen || capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	selectedToken.value = getClassToken(cls, 'sl-aspect-')
})

const selectToken = (value: string) => {
	// Toggle off if already selected
	const next = selectedToken.value === value ? null : value
	selectedToken.value = next

	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const cls = typeof node.attrs.class === 'string' ? node.attrs.class : ''
	const newClass = setClassToken(cls, 'sl-aspect-', next)
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, {
			...node.attrs,
			class: newClass || null,
		}),
	)
}
</script>

<style scoped>
@layer ui {
	.aspect-picker {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		padding: var(--sf-spacing-2xs);
	}

	.ap-label {
		font-size: 0.7rem;
		color: rgba(var(--text_primary) / var(--sf-alpha-6));
	}

	.ap-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	.ap-chip {
		height: 26px;
		border-radius: 4px;
		border: 1px solid rgba(var(--text_primary) / var(--sf-alpha-2));
		padding: 0 6px;
		cursor: pointer;
		transition: transform 0.08s;
		font-size: 0.75rem;
		line-height: 1;
		background: none;
		color: rgb(var(--text_primary));
	}

	.ap-chip:hover {
		transform: scale(1.05);
		background: rgba(var(--text_primary) / var(--sf-alpha-1));
	}
}
</style>
