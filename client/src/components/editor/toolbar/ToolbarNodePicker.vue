<template>
	<ToolbarPanelItem v-model:open="open" :icon="iconName" :tooltip="tooltip" align="end">
		<div v-if="open" class="picker-list sl-stack sf-gap-none">
			<template v-if="computedItems.length">
				<SfButton
					v-for="item in computedItems"
					:key="item.label"
					class="picker-item sf-is-contained"
					size="xs"
					:current="item.active"
					@mousedown.prevent="select(item)"
				>
					<span v-if="item.iconName" class="material-symbols-rounded sf-icon">{{
						item.iconName
					}}</span>
					<span>{{ item.label }}</span>
				</SfButton>
			</template>
			<div v-else class="picker-empty sf-loudness-1 sf-size-xs">No compatible types</div>
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
	// None where the names say it all (a code block's languages).
	iconName?: string
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

// Worked out only while the menu is open, the only time the list is drawn: it checks every block
// type, and the toolbar updates after every change.
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

	/* The stack makes rows full width; contents sit on the left and long labels wrap. */
	.picker-item {
		gap: var(--sf-spacing-xs);
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
