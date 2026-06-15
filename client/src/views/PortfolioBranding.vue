<template>
	<div class="mx-5 pt-5">
		<h1 class="text-4xl mb-5">Branding portfolio</h1>
		<CollectionGrid
			:items="items"
			:placeholder-title="isPending ? 'Loading...' : 'Coming Soon!'"
		/>
	</div>
</template>

<script lang="ts" setup>
import { getPortfolioEntries } from '@/services/portfolio'
import { computed } from 'vue'

const { data, isPending } = getPortfolioEntries(['brandPortfolio'])
const items = computed(() => data.value ?? [])
</script>
