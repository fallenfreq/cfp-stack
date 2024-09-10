<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
  >
    <BasicCard
      v-for="(item, index) in displayedItems"
      :key="index"
      :image="item.imageUrl"
      :title="item.title"
      :is-placeholder="item.isPlaceholder"
      :class="[
        'portfolio-item',
        { 'is-placeholder': item.isPlaceholder },
        ...(item.visibilityClasses || [])
      ]"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { getPortfolioEntries } from '@/services/portfolio'

// isPending is essential being handled by onMounted and watching for data changes bellow
const { data, isError } = getPortfolioEntries()

// Interface for PortfolioItem type
interface PortfolioItem {
  link?: string
  id?: number
  description?: string
  imageUrl: string | null
  title: string
  isPlaceholder?: boolean
  visibilityClasses?: string[]
}

interface Breakpoints {
  default: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

// Define breakpoints and the number of columns for each
const columns: Breakpoints = {
  default: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
  '2xl': 5
}

const displayedItems = ref<PortfolioItem[]>([])

const calculatePlaceholdersNeeded = (numItems: number) => {
  const placeholdersNeeded: Breakpoints = {
    default: 0,
    sm: 0,
    md: 0,
    lg: 0,
    xl: 0,
    '2xl': 0
  }
  for (const key of Object.keys(columns)) {
    const colCount = columns[key as keyof Breakpoints]
    if (numItems === 0) {
      // If no items, full line of placeholders
      placeholdersNeeded[key as keyof Breakpoints] = colCount
    } else {
      const remainder = numItems % colCount
      placeholdersNeeded[key as keyof Breakpoints] = remainder === 0 ? 0 : colCount - remainder
    }
  }
  return placeholdersNeeded
}

const getMaxItemsCount = (realItemsCount: number, placeholdersNeeded: Breakpoints): number => {
  const highestPlaceholderCount = Math.max(...Object.values(placeholdersNeeded))
  return realItemsCount + highestPlaceholderCount
}

const setDisplayedItems = async (defaultItem?: Partial<PortfolioItem>) => {
  const items = data.value || []
  const placeholdersNeeded = calculatePlaceholdersNeeded(items.length)
  const placeholders: PortfolioItem[] = []

  for (let i = 0; i < getMaxItemsCount(items.length, placeholdersNeeded); i++) {
    const placeholder: PortfolioItem = Object.assign(
      {
        imageUrl: null,
        title: '',
        isPlaceholder: true,
        visibilityClasses: []
      },
      defaultItem
    )

    const { visibilityClasses } = placeholder
    for (const key of Object.keys(placeholdersNeeded)) {
      if (i < placeholdersNeeded[key as keyof Breakpoints])
        visibilityClasses?.push('visible-' + key)
    }

    placeholders.push(placeholder)
  }
  displayedItems.value = [...items, ...placeholders]
}

watch([data, isError], () => {
  if (isError.value && !data.value) {
    setDisplayedItems({ title: '' })
  } else if (data.value) {
    setDisplayedItems({ title: 'Coming Soon!' })
  }
})

onMounted(() => {
  setDisplayedItems({ title: 'Loading...' })
})
</script>

<style scoped>
/* Hide placeholders by default */
.is-placeholder {
  display: none;
}

.visible-default {
  display: block;
}

@media (min-width: 640px) {
  .visible-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .visible-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .visible-lg {
    display: block;
  }
}

@media (min-width: 1280px) {
  .visible-xl {
    display: block;
  }
}

@media (min-width: 1536px) {
  .visible-2xl {
    display: block;
  }
}
</style>
