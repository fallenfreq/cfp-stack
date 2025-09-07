import type { CollectionEntry } from '@/../../api/src/schemas/collectionEntry'
import type { MapMarkerItem } from '@/components/demos/map/AddMarkerSwitch.vue'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type StackableItem =
	| { id: 'collectionEntry'; content: CollectionEntry }
	| { id: 'mapMarker'; content: MapMarkerItem }

export const useStackableSheetStore = defineStore('stackableSheet', () => {
	const sheetContent = ref<StackableItem | null>(null)
	const isSheetOpen = ref(false)

	const openSheet = (item: StackableItem) => {
		sheetContent.value = item
		isSheetOpen.value = true
	}

	const closeSheet = () => {
		isSheetOpen.value = false
		sheetContent.value = null
	}

	return {
		sheetContent,
		isSheetOpen,
		openSheet,
		closeSheet,
	}
})
