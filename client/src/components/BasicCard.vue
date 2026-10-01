<template>
	<component
		:is="to ? 'a' : 'div'"
		:href="to ? link.href.value : undefined"
		class="sl-stack sf-gap-sm"
		@click="onClick"
	>
		<div
			class="basic-card-picture sf-depth-1 sf-flush sl-aspect-4-3 sl-cover sl-object-cover"
			style="--sl-cover-min: 0"
		>
			<MothLogo
				v-if="imageUrl == ''"
				class="basic-card-logo sf-opacity-1"
				aria-hidden="true"
			/>
			<img v-else :src="imageUrl" alt="" />
		</div>
		<h2>{{ title }}</h2>
	</component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RouteLocationRaw, useLink } from 'vue-router'

const props = defineProps<{
	imageUrl: string
	title: string
	to?: RouteLocationRaw | undefined
	// Given: a plain click calls this instead of going to `to`. The card stays a link,
	// so new tab / middle-click still go to the page.
	onOpen?: (() => void) | undefined
}>()

const link = useLink({ to: computed(() => props.to ?? '/') })

const onClick = (e: MouseEvent) => {
	if (!props.to) return
	const plainClick = e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
	if (props.onOpen && plainClick && !e.defaultPrevented) {
		e.preventDefault()
		props.onOpen()
		return
	}
	link.navigate(e)
}
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
