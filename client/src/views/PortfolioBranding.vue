<template>
	<SfPageShell title="Branding portfolio">
		<CollectionGrid
			:items="items"
			:placeholder-title="isPending ? 'Loading...' : 'Coming Soon!'"
		/>
	</SfPageShell>
</template>

<script lang="ts" setup>
import { getPortfolioEntries } from '@/services/portfolio'
import { computed } from 'vue'

const { data, isPending } = getPortfolioEntries(['brandPortfolio'])
const items = computed(() => data.value ?? [])
</script>
