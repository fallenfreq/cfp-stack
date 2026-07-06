<template>
	<ToolbarPanelItem
		:icon="iconName"
		:tooltip="tooltip"
		:open="open"
		@toggle="toggle"
		@close="close"
	>
		<div class="picker-list">
			<template v-if="computedItems.length">
				<div
					v-for="item in computedItems"
					:key="item.label"
					class="picker-item"
					:class="{ 'sf-on-current': item.active }"
					@mousedown.prevent="select(item)"
				>
					<span class="material-symbols-rounded picker-item-icon">{{
						item.iconName
					}}</span>
					<span>{{ item.label }}</span>
				</div>
			</template>
			<div v-else class="picker-item picker-empty">No compatible types</div>
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

const close = () => {
	open.value = false
}

const toggle = () => {
	open.value = !open.value
}

const select = (item: NodePickerItem) => {
	item.action()
	close()
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

	.picker-item {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-xs));
		cursor: pointer;
		padding: 5px 8px;
		border-radius: 4px;
		font-size: 0.85rem;
		color: rgb(var(--text_primary));
		user-select: none;
	}

	.picker-item:hover {
		background: rgba(var(--text_primary) / var(--sf-alpha-1));
	}

	.picker-item-icon {
		font-size: 16px;
		line-height: 1;
	}

	.picker-empty {
		color: gray;
		text-align: center;
		cursor: default;
		justify-content: center;
	}
}
</style>
