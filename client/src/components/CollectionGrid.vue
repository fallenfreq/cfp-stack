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
import type { CollectionEntry } from '@/../../api/src/schemas/collectionEntry'
import { getPortfolioEntries } from '@/services/portfolio'
import {
	calculatePlaceholdersNeeded,
	createPlaceholders,
	type Breakpoints,
} from '@/utils/collectionPlaceholders'
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
	name: Parameters<typeof getPortfolioEntries>[0]
}>()

// isPending is essentially being handled by onMounted and watching for data changes bellow
const { data, isError } = getPortfolioEntries(props.name)

const emit = defineEmits<(event: 'selectItem', item: CollectionEntry) => void>()

// Define breakpoints and the number of columns for each
const columns: Breakpoints = {
	default: 1,
	sm: 2,
	md: 3,
	lg: 4,
	xl: 4,
	'2xl': 5,
}

const displayedItems = ref<CollectionEntry[]>([])
const visibilityMap = ref<Map<CollectionEntry, string[]>>(new Map())

const setDisplayedItems = async (title: CollectionEntry['title'] = '') => {
	const items = data.value || []
	const placeholdersNeeded = calculatePlaceholdersNeeded(items.length, columns)

	const customClassMap = {
		default: 'block',
		sm: 'sm:block',
		md: 'md:block',
		lg: 'lg:block',
		xl: 'xl:block',
		'2xl': '2xl:block',
	}

	const { placeholders, visibilityMap: newVisibilityMap } = createPlaceholders(
		placeholdersNeeded,
		title,
		customClassMap,
	)

	displayedItems.value = [...items, ...placeholders]
	visibilityMap.value = newVisibilityMap
}

watch([data, isError], () => {
	if (isError.value && !data.value) {
		setDisplayedItems('')
	} else if (data.value) {
		setDisplayedItems('Coming Soon!')
	}
})

onMounted(() => {
	setDisplayedItems(data.value ? 'Coming Soon!' : 'Loading...')
})
</script>
