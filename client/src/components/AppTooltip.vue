<template>
	<span
		class="tooltip-root"
		:aria-describedby="tooltipId"
		@mouseenter="onEnter"
		@mouseleave="onLeave"
		@touchstart.passive="onTouchStart"
		@touchend="onTouchEnd"
		@touchcancel="onTouchEnd"
	>
		<slot />
		<span
			v-if="visible && text"
			:id="tooltipId"
			role="tooltip"
			class="tooltip-popup"
			:class="`placement-${placement ?? 'bottom'}`"
		>
			{{ text }}
		</span>
	</span>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
	text: string
	placement?: 'top' | 'bottom' | 'left' | 'right'
	delay?: number
}>()

const tooltipId = `tooltip-${Math.random().toString(36).slice(2)}`
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let lastTouchEnd = 0

const onEnter = () => {
	// Block the synthesized mouseenter that touch browsers fire after a tap
	if (Date.now() - lastTouchEnd < 600) return
	timer = setTimeout(() => {
		visible.value = true
	}, props.delay ?? 400)
}

const onLeave = () => {
	if (timer) {
		clearTimeout(timer)
		timer = null
	}
	visible.value = false
}

const onTouchStart = () => {
	timer = setTimeout(() => {
		visible.value = true
	}, 500)
}

const onTouchEnd = () => {
	lastTouchEnd = Date.now()
	if (timer) {
		clearTimeout(timer)
		timer = null
	}
	visible.value = false
}
</script>

<style scoped>
.tooltip-root {
	position: relative;
	display: inline-flex;
}

.tooltip-popup {
	position: absolute;
	z-index: 1100;
	pointer-events: none;
	white-space: nowrap;
	font-size: 11px;
	padding: 3px 7px;
	border-radius: 4px;
	background: rgb(var(--backgroundPrimary));
	border: 1px solid rgb(var(--backgroundBorder));
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	color: rgb(var(--textPrimary));
}

.placement-bottom {
	top: calc(100% + 5px);
	left: 50%;
	transform: translateX(-50%);
}

.placement-top {
	bottom: calc(100% + 5px);
	left: 50%;
	transform: translateX(-50%);
}

.placement-left {
	right: calc(100% + 5px);
	top: 50%;
	transform: translateY(-50%);
}

.placement-right {
	left: calc(100% + 5px);
	top: 50%;
	transform: translateY(-50%);
}
</style>
