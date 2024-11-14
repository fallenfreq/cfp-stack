// stores/portfolioStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type PortfolioEntry } from '@/../../api/src/schemas/portfolio'

export const useStackableSheetStore = defineStore('stackableSheet', () => {
  const sheetContent = ref<null | PortfolioEntry>(null)
  const isSheetOpen = ref(false)

  const openSheet = (item: PortfolioEntry) => {
    sheetContent.value = item
    isSheetOpen.value = true
  }

  const closeSheet = () => {
    isSheetOpen.value = false
    sheetContent.value = null
  }

  return { sheetContent, isSheetOpen, openSheet, closeSheet }
})
