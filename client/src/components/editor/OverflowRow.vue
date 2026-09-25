<template>
	<div class="overflow-row sl-scroll-frame">
		<div
			ref="scrollerEl"
			class="overflow-row__scroller sl-cluster sl-scroll-x sf-gap-xs sf-size-2xs"
			:class="{
				'sf-is-overflow-left': overflowLeft,
				'sf-is-overflow-right': overflowRight,
			}"
		>
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useScrollOverflow } from '@/composables/useScrollOverflow'
import { ref, toRef } from 'vue'

const props = defineProps<{
	refreshKey?: unknown
}>()

const scrollerEl = ref<HTMLElement | null>(null)
// Adding a tool changes what's hidden without changing the row's size, so the size
// watcher alone misses it — refreshKey re-checks.
const { left: overflowLeft, right: overflowRight } = useScrollOverflow(
	scrollerEl,
	toRef(props, 'refreshKey'),
)
</script>

<style>
@layer ui {
	/* The row's own end padding, at its size (the toolbar is sf-flush). */
	.overflow-row__scroller {
		padding-inline: var(--sf-padding);
	}
}
</style>
