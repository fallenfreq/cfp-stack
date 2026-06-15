<script setup lang="ts">
import type { CollectionEntry } from '@/../../api/src/schemas/collectionEntry'
import { getPortfolioEntries } from '@/services/portfolio'
import zitadelAuth from '@/services/zitadelAuth'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import type { GridItem } from '@/utils/collectionPlaceholders'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const sheetStore = useStackableSheetStore()
const { sheetContent } = storeToRefs(sheetStore)
const { closeSheet, openSheet } = sheetStore

const { data, isPending } = getPortfolioEntries(['webDesignPortfolio'])
const items = computed(() => data.value ?? [])

const onSelectItem = (item: GridItem) => {
	openSheet({ id: 'collectionEntry', content: item as CollectionEntry })
}
</script>

<template>
	<StackableSheet mobile-height="50%" desktop-width="65%" @close="closeSheet">
		<div v-if="sheetContent?.id === 'collectionEntry'">
			{{ sheetContent.content.content }}
			This will soon display the content of the selected item.
		</div>
	</StackableSheet>

	<div class="mx-5">
		<div class="flex justify-between items-center mb-5">
			<h1 class="text-4xl">Web & app design</h1>
			<CollectionNav v-if="zitadelAuth.oidcAuth.isAuthenticated" />
		</div>
		<CollectionGrid
			:items="items"
			:placeholder-title="isPending ? 'Loading...' : 'Coming Soon!'"
			@select-item="onSelectItem"
		/>
	</div>
</template>
