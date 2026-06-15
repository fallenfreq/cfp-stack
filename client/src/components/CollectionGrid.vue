<template>
	<div
		class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
	>
		<BasicCard
			v-for="(item, index) in displayedItems"
			:key="index"
			:image-url="item.imageUrl"
			:title="item.title"
			:class="visibilityMap.get(item)?.join(' ')"
			@click="() => emit('selectItem', item)"
		/>
	</div>
</template>

<script lang="ts" setup>
import {
	calculatePlaceholdersNeeded,
	createPlaceholders,
	type Breakpoints,
	type GridItem,
} from '@/utils/collectionPlaceholders'
import { ref, watch } from 'vue'

const props = defineProps<{
	items: GridItem[]
	placeholderTitle?: string
}>()

const emit = defineEmits<{
	selectItem: [item: GridItem]
}>()

const columns: Breakpoints = {
	default: 1,
	sm: 2,
	md: 3,
	lg: 4,
	xl: 4,
	'2xl': 5,
}

const displayedItems = ref<GridItem[]>([])
const visibilityMap = ref<Map<GridItem, string[]>>(new Map())

const customClassMap = {
	default: 'block',
	sm: 'sm:block',
	md: 'md:block',
	lg: 'lg:block',
	xl: 'xl:block',
	'2xl': '2xl:block',
}

const setDisplayedItems = (items: GridItem[]) => {
	const placeholdersNeeded = calculatePlaceholdersNeeded(items.length, columns)
	const { placeholders, visibilityMap: newVisibilityMap } = createPlaceholders(
		placeholdersNeeded,
		props.placeholderTitle ?? 'Coming Soon!',
		customClassMap,
	)
	displayedItems.value = [...items, ...placeholders]
	visibilityMap.value = newVisibilityMap
}

watch(() => props.items, setDisplayedItems, { immediate: true })
</script>
