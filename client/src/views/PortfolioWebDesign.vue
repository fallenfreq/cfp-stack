<script setup lang="ts">
import { computed } from 'vue'
import zitadelAuth from '@/services/zitadelAuth'
const isAuthenticated = computed(() => zitadelAuth.oidcAuth.isAuthenticated)
</script>

<template>
  <CollectionNav :v-if="isAuthenticated"> </CollectionNav>
  <div class="mx-5">
    <h1 class="text-4xl mb-5">Web & app design portfolio</h1>
    <Portfolio :portfolio="['webDesignPortfolio']" />
  </div>
</template>
