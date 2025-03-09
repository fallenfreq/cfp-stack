<script setup lang="ts">
import zitadelAuth from '@/services/zitadelAuth'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { storeToRefs } from 'pinia'

const sheetStore = useStackableSheetStore()
const { sheetContent } = storeToRefs(sheetStore)
const { closeSheet, openSheet } = sheetStore
</script>

<template>
  <StackableSheet mobileHeight="50%" desktopWidth="65%" @close="closeSheet">
    <div v-if="sheetContent?.id === 'collectionEntry'">
      {{ sheetContent.content.content }}
      This will soon display the content of the selected item.
    </div>
  </StackableSheet>

  <div class="mx-5">
    <div class="flex justify-between items-center mb-5">
      <h1 class="text-4xl">Web & app design</h1>
      <CollectionNav v-if="zitadelAuth.oidcAuth.isAuthenticated" />
    </div>
    <CollectionGrid
      :name="['webDesignPortfolio']"
      @selectItem="(portfolio) => openSheet({ id: 'collectionEntry', content: portfolio })"
    />
  </div>
</template>
