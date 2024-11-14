<template>
  <div class="w-full h-auto">
    <div
      class="bg-backgroundSecondary rounded-lg overflow-hidden relative w-full aspect-[4/3] flex items-center justify-center"
    >
      <MothLogo v-if="imageUrl == ''" class="w-1/2 h-1/2 opacity-5" />
      <img v-else class="w-full h-full object-cover" :src="imageUrl" alt="Portfolio Image" />
    </div>
    <div class="py-3">
      <h2>{{ title }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  imageUrl: string
  title: string
}>()
</script>
