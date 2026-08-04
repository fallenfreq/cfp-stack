<template>
	<div class="dropdown-menu sf-depth-2 sf-size-2xs">
		<template v-if="items.length">
			<div
				v-for="(item, index) in items"
				:key="index"
				class="menu-item sf-on-hover sf-size-2xs"
				:class="{ 'sf-on-current': index === selectedIndex }"
				@click="selectItem(index)"
			>
				{{ item.title }}
			</div>
		</template>
		<div v-else class="menu-item no-commands sf-loudness-1 sf-size-2xs">No Commands</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = defineProps<{
	items: { title: string; command: (args: { editor: any; range: any }) => void }[]
	editor: any
	range: any
}>()

const selectedIndex = ref(0)

watch(
	() => props.items,
	() => {
		selectedIndex.value = 0
	},
)

const selectItem = (index: number) => {
	const item = props.items[index]
	if (item) {
		item.command({ editor: props.editor, range: props.range })
	}
}

const onKeyDown = (event: KeyboardEvent) => {
	if (props.items.length === 0) return

	if (event.key === 'ArrowDown') {
		selectedIndex.value = (selectedIndex.value + 1) % props.items.length
		return true
	} else if (event.key === 'ArrowUp') {
		selectedIndex.value = (selectedIndex.value - 1 + props.items.length) % props.items.length
		return true
	} else if (event.key === 'Enter') {
		selectItem(selectedIndex.value)
		return true
	}
}

defineExpose({ onKeyDown })
</script>

<style>
@layer ui {
	.dropdown-menu {
		overflow-y: auto;
		min-width: 200px;
		scrollbar-width: none;
	}
	.dropdown-menu::-webkit-scrollbar {
		display: none;
	}

	.menu-item {
		cursor: pointer;
		padding: var(--sf-padding);
	}

	.no-commands {
		text-align: center;
		cursor: default;
	}
}
</style>
