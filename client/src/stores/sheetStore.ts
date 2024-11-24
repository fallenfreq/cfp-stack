// stores/portfolioStore.ts
import { defineStore } from 'pinia'
import { ref, type UnwrapRef } from 'vue'
// TODO: make this a generic store
export const useStackableSheetStore = <T>() =>
  defineStore('stackableSheet', () => {
    const sheetContent = ref<null | T>(null)
    const isSheetOpen = ref(false)

    const openSheet = (item: null | UnwrapRef<T>) => {
      sheetContent.value = item
      isSheetOpen.value = true
    }

    const closeSheet = () => {
      isSheetOpen.value = false
      sheetContent.value = null
    }

    return { sheetContent, isSheetOpen, openSheet, closeSheet }
  })()
