<template>
	<ToolbarPanelItem
		:icon="iconName"
		:tooltip="tooltip"
		:open="open"
		align="right"
		@toggle="toggle"
		@close="close"
	>
		<div class="picker-list sf-size-xs">
			<template v-if="computedItems.length">
				<button
					v-for="item in computedItems"
					:key="item.label"
					type="button"
					class="picker-item sf sf-is-contained sf-size-xs sf-on-hover"
					:class="{ 'sf-on-current': item.active }"
					@mousedown.prevent="select(item)"
				>
					<span class="material-symbols-rounded sf-icon">{{ item.iconName }}</span>
					<span>{{ item.label }}</span>
				</button>
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
		width: 100%;
		text-align: left;
		cursor: pointer;
		user-select: none;
	}

	.picker-empty {
		padding: var(--sf-padding);
		text-align: center;
	}
}
</style>
