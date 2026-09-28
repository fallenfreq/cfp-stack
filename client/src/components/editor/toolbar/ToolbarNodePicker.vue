<template>
	<ToolbarPanelItem v-model:open="open" :icon="iconName" :tooltip="tooltip" align="end">
		<div class="picker-list sf-size-xs">
			<template v-if="computedItems.length">
				<SfButton
					v-for="item in computedItems"
					:key="item.label"
					class="picker-item sf-is-contained"
					size="xs"
					:current="item.active"
					@mousedown.prevent="select(item)"
				>
					<span class="material-symbols-rounded sf-icon">{{ item.iconName }}</span>
					<span>{{ item.label }}</span>
				</SfButton>
			</template>
			<div v-else class="picker-empty sf-loudness-1">No compatible types</div>
		</div>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref } from 'vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

export interface NodePickerItem {
	label: string
	iconName: string
	active: boolean
	action: () => void
}

const props = defineProps<{
	editor: Editor
	context: ToolbarItemContext
	iconName: string
	tooltip: string
	getItems: (editor: Editor, context: ToolbarItemContext) => NodePickerItem[]
}>()

const open = ref(false)

const computedItems = computed(() => props.getItems(props.editor, props.context))

const select = (item: NodePickerItem) => {
	item.action()
	open.value = false
}
</script>

<style scoped>
@layer ui {
	.picker-list {
		min-width: 160px;
		max-height: 240px;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.picker-list::-webkit-scrollbar {
		display: none;
	}

	/* Full-width rows, contents on the left; long labels wrap. */
	.picker-item {
		display: flex;
		gap: var(--sf-gap, var(--sf-spacing-xs));
		width: 100%;
		justify-content: start;
		white-space: normal;
		user-select: none;
	}

	.picker-empty {
		padding: var(--sf-padding);
		text-align: center;
	}
}
</style>
