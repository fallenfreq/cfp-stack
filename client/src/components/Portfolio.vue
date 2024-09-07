<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
  >
    <BasicCard
      v-for="item in displayedItems"
      :key="item.id"
      :image="item.image"
      :title="item.title"
      :is-placeholder="item.isPlaceholder"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchPortfolioItems } from '@/services/portfolio'

const portfolioItems = ref([])

onMounted(async () => {
  const items = await fetchPortfolioItems()
  portfolioItems.value = items
})

const displayedItems = computed(() => {
  const items = portfolioItems.value
  const placeholdersNeeded = Math.max(0, 4 - items.length)

  const placeholders = Array(placeholdersNeeded).fill({
    image: null,
    title: 'Coming Soon!',
    isPlaceholder: true
  })

  // Combine actual items with placeholders
  return [...items.map((item) => ({ ...item, isPlaceholder: false })), ...placeholders]
})
</script>
