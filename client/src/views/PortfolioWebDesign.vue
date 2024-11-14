<script setup lang="ts">
import { computed } from 'vue'
import zitadelAuth from '@/services/zitadelAuth'
import { useStackableSheetStore } from '@/stores/sheetStore'
const sheetStore = useStackableSheetStore()
const isAuthenticated = computed(() => zitadelAuth.oidcAuth.isAuthenticated)
</script>

<template>
  <StackableSheet mobileHeight="40%" desktopWidth="65%" @close="sheetStore.closeSheet">
    <div v-if="sheetStore.sheetContent">
      {{ sheetStore.sheetContent.title }}
      {{ sheetStore.sheetContent.content }}
    </div>
  </StackableSheet>

  <div class="mx-5">
    <h1 class="text-4xl mb-5">Web & app design portfolio</h1>
    <CollectionNav v-if="isAuthenticated" />
    <CollectionGrid :name="['webDesignPortfolio']" @selectItem="sheetStore.openSheet" />
  </div>
</template>
