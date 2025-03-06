// stores/portfolioStore.ts
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useStackableSheetStore = <T>() =>
  defineStore('stackableSheet', () => {
    const sheetContent: Ref<null | T> = ref(null)
    const isSheetOpen = ref(false)

    const openSheet = (item: null | T) => {
      sheetContent.value = item
      isSheetOpen.value = true
    }

    const closeSheet = () => {
      isSheetOpen.value = false
      sheetContent.value = null
    }

    return { sheetContent, isSheetOpen, openSheet, closeSheet }
  })()
