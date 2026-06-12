<template>
	<span
		ref="rootEl"
		class="tooltip-root"
		:aria-describedby="tooltipId"
		@mouseenter="onEnter"
		@mouseleave="onLeave"
		@touchstart.passive="onTouchStart"
		@touchend="onTouchEnd"
		@touchcancel="onTouchEnd"
	>
		<slot />
		<Teleport to="body">
			<span
				v-if="visible && text"
				:id="tooltipId"
				ref="popupEl"
				role="tooltip"
				class="tooltip-popup"
				:style="tooltipStyle"
			>
				{{ text }}
			</span>
		</Teleport>
	</span>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'

const props = defineProps<{
	text: string
	placement?: 'top' | 'bottom' | 'left' | 'right'
	delay?: number
}>()

const tooltipId = `tooltip-${Math.random().toString(36).slice(2)}`
const visible = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const popupEl = ref<HTMLElement | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
let timer: ReturnType<typeof setTimeout> | null = null
let lastTouchEnd = 0

const getTooltipPosition = (
	triggerRect: DOMRect,
	popupRect: DOMRect,
	placement: 'top' | 'bottom' | 'left' | 'right',
) => {
	const gap = placement === 'top' ? 15 : 5
	const centeredLeft = triggerRect.left + (triggerRect.width - popupRect.width) / 2
	const centeredTop = triggerRect.top + (triggerRect.height - popupRect.height) / 2

	if (placement === 'top') {
		return { top: triggerRect.top - popupRect.height - gap, left: centeredLeft }
	}
	if (placement === 'left') {
		return { top: centeredTop, left: triggerRect.left - popupRect.width - gap }
	}
	if (placement === 'right') {
		return { top: centeredTop, left: triggerRect.right + gap }
	}
	return { top: triggerRect.bottom + gap, left: centeredLeft }
}

const updatePosition = async () => {
	await nextTick()

	if (!rootEl.value || !popupEl.value) return

	const triggerRect = rootEl.value.getBoundingClientRect()
	const popupRect = popupEl.value.getBoundingClientRect()
	const { top, left } = getTooltipPosition(triggerRect, popupRect, props.placement ?? 'bottom')

	tooltipStyle.value = {
		top: `${top}px`,
		left: `${left}px`,
	}
}

const onEnter = () => {
	// Block the synthesized mouseenter that touch browsers fire after a tap
	if (Date.now() - lastTouchEnd < 600) return
	timer = setTimeout(() => {
		visible.value = true
		updatePosition()
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
	if (timer) {
		clearTimeout(timer)
		timer = null
	}
	timer = setTimeout(() => {
		visible.value = true
		updatePosition()
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

onUnmounted(() => {
	if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.tooltip-root {
	position: relative;
	display: inline-flex;
	user-select: none;
	-webkit-user-select: none;
	-webkit-touch-callout: none;
}

.tooltip-popup {
	position: fixed;
	z-index: var(--z-overlay);
	pointer-events: none;
	white-space: nowrap;
	font-size: 11px;
	padding: 3px 7px;
	border-radius: 4px;
	background: rgb(var(--backgroundPrimary));
	border: 1px solid rgb(var(--backgroundBorder));
	box-shadow: 0 2px 6px rgb(0 0 0 / var(--alpha-20));
	color: rgb(var(--textPrimary));
}
</style>
