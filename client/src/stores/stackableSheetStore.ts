import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PortfolioEntry } from '@/../../api/src/schemas/portfolio'
import type { MapMarkerItem } from '@/components/demos/map/AddMarkerSwitch.vue'

type StackableItem =
  | { id: 'portfolio'; content: PortfolioEntry }
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
    closeSheet
  }
})
