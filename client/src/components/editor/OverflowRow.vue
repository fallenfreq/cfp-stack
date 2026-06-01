<template>
	<div
		class="overflow-row"
		:class="{
			'has-overflow-left': overflow.left,
			'has-overflow-right': overflow.right,
		}"
	>
		<div ref="scrollerEl" class="overflow-row__scroller" @scroll.passive="syncOverflow">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
	refreshKey?: unknown
}>()

const scrollerEl = ref<HTMLElement | null>(null)
const overflow = ref({ left: false, right: false })

const OVERFLOW_EPSILON = 2

const syncOverflow = () => {
	const scroller = scrollerEl.value
	if (!scroller) return

	const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
	overflow.value = {
		left: scroller.scrollLeft > OVERFLOW_EPSILON,
		right: maxScrollLeft - scroller.scrollLeft > OVERFLOW_EPSILON,
	}
}

const refreshOverflow = async () => {
	await nextTick()
	syncOverflow()
}

onMounted(refreshOverflow)

watch(() => props.refreshKey, refreshOverflow)
</script>

<style scoped>
.overflow-row {
	position: relative;
	overflow: visible;
}

.overflow-row::before,
.overflow-row::after {
	content: '';
	position: absolute;
	top: 1px;
	bottom: 1px;
	width: 34px;
	border-radius: 3px;
	pointer-events: none;
	opacity: 0;
	transition: opacity 0.15s ease;
	z-index: 1;
}

.overflow-row::before {
	left: 1px;
	background: linear-gradient(
		to right,
		rgba(var(--backgroundSecondary) / 1) 0%,
		rgba(var(--backgroundSecondary) / 0.94) 42%,
		rgba(var(--backgroundSecondary) / 0)
	);
}

.overflow-row::after {
	right: 1px;
	background: linear-gradient(
		to left,
		rgba(var(--backgroundSecondary) / 1) 0%,
		rgba(var(--backgroundSecondary) / 0.94) 42%,
		rgba(var(--backgroundSecondary) / 0)
	);
}

.overflow-row.has-overflow-left::before {
	opacity: 0.95;
}

.overflow-row.has-overflow-right::after {
	opacity: 0.95;
}

.overflow-row__scroller {
	display: flex;
	flex-wrap: nowrap;
	gap: 0.5rem;
	width: max-content;
	max-width: calc(100vw - 2rem);
	overflow-x: auto;
	overflow-y: hidden;
	overscroll-behavior-x: contain;
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.overflow-row__scroller::-webkit-scrollbar {
	display: none;
}
</style>
