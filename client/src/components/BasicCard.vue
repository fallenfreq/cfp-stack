<template>
	<component :is="to ? RouterLink : 'div'" :to="to" class="sl-stack sf-gap-sm">
		<div
			class="basic-card-picture sf-depth-1 sf-flush sl-aspect-4-3 sl-cover sl-object-cover"
			style="--sl-cover-min: 0"
		>
			<MothLogo
				v-if="imageUrl == ''"
				class="basic-card-logo sf-opacity-1"
				aria-hidden="true"
			/>
			<img v-else :src="imageUrl" alt="">
		</div>
		<h2>{{ title }}</h2>
	</component>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

defineProps<{
	imageUrl: string
	title: string
	to?: RouteLocationRaw | undefined
}>()
</script>

<style scoped>
/* Cuts the picture to the card's rounded corners. */
.basic-card-picture {
	overflow: clip;
}

.basic-card-logo {
	width: 50%;
	height: 50%;
}
</style>
