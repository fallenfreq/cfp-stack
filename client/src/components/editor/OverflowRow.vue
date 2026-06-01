<template>
	<div
		class="overflow-row"
		:class="{
			'has-overflow-left': overflow.left,
			'has-overflow-right': overflow.right,
		}"
	>
		<div
			ref="scrollerEl"
			class="overflow-row__scroller"
			:style="maskStyle"
			@scroll.passive="syncOverflow"
		>
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

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

const maskStyle = computed(() => {
	const { left, right } = overflow.value
	if (left && right)
		return {
			maskImage:
				'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)',
		}
	if (left) return { maskImage: 'linear-gradient(to right, transparent, black 40px)' }
	if (right) return { maskImage: 'linear-gradient(to left, transparent, black 40px)' }
	return {}
})

onMounted(refreshOverflow)

watch(() => props.refreshKey, refreshOverflow)
</script>

<style scoped>
.overflow-row {
	position: relative;
}

.overflow-row::before,
.overflow-row::after {
	content: '';
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 0;
	height: 0;
	pointer-events: none;
	opacity: 0;
	transition: opacity 0.15s ease;
	z-index: 1;
}

.overflow-row::before {
	left: 3px;
	border-top: 4px solid transparent;
	border-bottom: 4px solid transparent;
	border-right: 5px solid rgba(var(--textPrimary) / 0.5);
}

.overflow-row::after {
	right: 3px;
	border-top: 4px solid transparent;
	border-bottom: 4px solid transparent;
	border-left: 5px solid rgba(var(--textPrimary) / 0.5);
}

.overflow-row.has-overflow-left::before {
	opacity: 1;
}

.overflow-row.has-overflow-right::after {
	opacity: 1;
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
