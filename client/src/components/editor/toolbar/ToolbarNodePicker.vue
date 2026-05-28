<template>
	<div ref="pickerEl" class="toolbar-node-picker">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>{{ iconName }}</ToolbarIcon>
		</ToolbarButton>
		<div v-if="open" class="node-picker-list">
			<template v-if="computedItems.length">
				<div
					v-for="item in computedItems"
					:key="item.label"
					class="picker-item"
					:class="{ 'is-active': item.active }"
					@mousedown.prevent="select(item)"
				>
					<span class="material-symbols-rounded picker-item-icon">{{ item.iconName }}</span>
					<span>{{ item.label }}</span>
				</div>
			</template>
			<div v-else class="picker-item picker-empty">No compatible types</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { Editor } from '@tiptap/vue-3'
import { computed, onUnmounted, ref, watch } from 'vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'

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
const pickerEl = ref<HTMLElement | null>(null)

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

const onDocMousedown = (e: MouseEvent) => {
	if (pickerEl.value && !pickerEl.value.contains(e.target as Node)) {
		close()
	}
}

watch(open, (isOpen) => {
	if (isOpen) {
		document.addEventListener('mousedown', onDocMousedown)
	} else {
		document.removeEventListener('mousedown', onDocMousedown)
	}
})

onUnmounted(() => {
	document.removeEventListener('mousedown', onDocMousedown)
})
</script>

<style scoped>
.toolbar-node-picker {
	position: relative;
}

.node-picker-list {
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 1001;
	background: rgb(var(--backgroundSecondary));
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 4px;
	padding: 4px;
	min-width: 160px;
	max-height: 240px;
	overflow-y: auto;
	scrollbar-width: none;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	margin-top: 4px;
}

.node-picker-list::-webkit-scrollbar {
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
	color: rgb(var(--textPrimary));
	user-select: none;
}

.picker-item:hover {
	background: rgba(var(--textPrimary) / 0.08);
}

.picker-item.is-active {
	background: rgba(var(--primary) / 0.12);
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
