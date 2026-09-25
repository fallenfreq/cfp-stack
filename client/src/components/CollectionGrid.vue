<template>
	<div ref="gridEl" class="collection-grid sl-grid sf-gap-md" style="--sl-min: 14rem">
		<BasicCard
			v-for="(item, index) in displayedItems"
			:key="index"
			:image-url="item.imageUrl"
			:title="item.title"
			@click="() => emit('selectItem', item)"
		/>
	</div>
</template>

<script lang="ts" setup>
import type { GridItem } from '@/utils/collectionPlaceholders'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
	items: GridItem[]
	placeholderTitle?: string
}>()

const emit = defineEmits<{
	selectItem: [item: GridItem]
}>()

const gridEl = ref<HTMLElement | null>(null)
// Columns the browser actually laid out — sl-grid fits as many as the width allows.
// Empty tracks still count: auto-fit lists them as 0px.
const columns = ref(1)
let ro: ResizeObserver | null = null

const countColumns = () => {
	const el = gridEl.value
	if (!el) return
	const tracks = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length
	columns.value = Math.max(tracks, 1)
}

onMounted(() => {
	countColumns()
	ro = new ResizeObserver(countColumns)
	if (gridEl.value) ro.observe(gridEl.value)
})

onUnmounted(() => {
	ro?.disconnect()
	ro = null
})

// Placeholder cards fill the last row; an empty collection shows one full row of them.
const displayedItems = computed<GridItem[]>(() => {
	const cols = columns.value
	const count = props.items.length
	const needed = count === 0 ? cols : (cols - (count % cols)) % cols
	const title = props.placeholderTitle ?? 'Coming Soon!'
	return [...props.items, ...Array.from({ length: needed }, () => ({ imageUrl: '', title }))]
})
</script>
