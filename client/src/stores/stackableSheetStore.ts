import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'

const _useStackableSheetStore = defineStore('stackableSheet', () => {
  const sheetContent = ref<unknown>(null)
  const isSheetOpen = ref(false)

  const openSheet = <T>(item: T) => {
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

export function useStackableSheetStore<T>() {
  const sheetStore = _useStackableSheetStore()
  const { isSheetOpen } = storeToRefs(sheetStore)
  // TODO: This is a workaround to get the correct type of sheetContent and needs rethinkng about
  const typedSheetContent = computed(() => sheetStore.sheetContent as T | null)

  return {
    sheetContent: typedSheetContent,
    isSheetOpen,
    openSheet: sheetStore.openSheet<T>,
    closeSheet: sheetStore.closeSheet
  }
}
