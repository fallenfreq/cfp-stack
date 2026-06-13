<template>
	<div ref="anchorEl" class="toolbar-node-picker">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>{{ iconName }}</ToolbarIcon>
		</ToolbarButton>
		<ToolbarPanel :open="open" :anchor-el="anchorEl" @close="close">
			<div class="picker-list">
				<template v-if="computedItems.length">
					<div
						v-for="item in computedItems"
						:key="item.label"
						class="picker-item"
						:class="{ 'is-active': item.active }"
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
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref } from 'vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import ToolbarPanel from './ToolbarPanel.vue'

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
	getItems: (editor: Editor, context: ToolbarItemContext) => NodePickerItem[]
}>()

const open = ref(false)
const anchorEl = ref<HTMLElement | null>(null)

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
	gap: 6px;
	cursor: pointer;
	padding: 5px 8px;
	border-radius: 4px;
	font-size: 0.85rem;
	color: rgb(var(--text_primary));
	user-select: none;
}

.picker-item:hover {
	background: rgba(var(--text_primary) / var(--alpha-10));
}

.picker-item.is-active {
	background: rgba(var(--primary) / var(--alpha-10));
	color: rgb(var(--primary));
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
</style>
