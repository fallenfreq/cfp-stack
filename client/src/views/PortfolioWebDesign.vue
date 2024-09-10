<script setup lang="ts">
import Portfolio from '@/components/Portfolio.vue'
</script>

<template>
  <div class="mx-5">
    <h1 class="text-4xl mb-5">Web & app design portfolio</h1>
    <Portfolio :portfolio="['brandPortfolio']" />
  </div>
</template>
