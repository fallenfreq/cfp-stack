<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
  >
    <BasicCard
      v-for="(item, index) in displayedItems"
      :key="index"
      :imageUrl="item.imageUrl"
      :title="item.title"
      @click="() => emit('selectItem', item)"
      :class="
        'isPlaceholder' in item && {
          hidden: item.isPlaceholder && !item.visibilityClasses.includes('visible-default'),
          block: item.visibilityClasses.includes('visible-default'),
          'sm:block': item.visibilityClasses.includes('visible-sm'),
          'md:block': item.visibilityClasses.includes('visible-md'),
          'lg:block': item.visibilityClasses.includes('visible-lg'),
          'xl:block': item.visibilityClasses.includes('visible-xl'),
          '2xl:block': item.visibilityClasses.includes('visible-2xl')
        }
      "
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { getPortfolioEntries } from '@/services/portfolio'
import type { CollectionEntry } from '@/../../api/src/schemas/collectionEntry'
import {
  calculatePlaceholdersNeeded,
  createPlaceholders,
  type Breakpoints,
  type CollectionItem
} from '@/utils/collectionPlaceholders'

const props = defineProps<{
  name: Parameters<typeof getPortfolioEntries>[0]
}>()

// isPending is essentially being handled by onMounted and watching for data changes bellow
const { data, isError } = getPortfolioEntries(props.name)

const emit = defineEmits<{
  (event: 'selectItem', item: CollectionEntry): void
}>()

// Define breakpoints and the number of columns for each
const columns: Breakpoints = {
  default: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
  '2xl': 5
}

const displayedItems = ref<CollectionItem[]>([])

const setDisplayedItems = async (title: CollectionItem['title'] = '') => {
  const items = data.value || []
  const placeholdersNeeded = calculatePlaceholdersNeeded(items.length, columns)
  const placeholders = createPlaceholders(placeholdersNeeded, title)
  displayedItems.value = [...items, ...placeholders]
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
