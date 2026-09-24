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
				class="tooltip-popup sf sf-text-block sf-text-xs sf-depth-3 sf-size-2xs sf-is-overlay"
				:data-placement="placement ?? 'top'"
				:data-input="input"
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
// How the tooltip was opened; the CSS widens the gap for touch.
const input = ref<'mouse' | 'touch'>('mouse')
let timer: ReturnType<typeof setTimeout> | null = null
let lastTouchEnd = 0

const getTooltipPosition = (
	triggerRect: DOMRect,
	popupRect: DOMRect,
	placement: 'top' | 'bottom' | 'left' | 'right',
) => {
	// Positions the popup flush against the trigger; the CSS adds the gap.
	const centeredLeft = triggerRect.left + (triggerRect.width - popupRect.width) / 2
	const centeredTop = triggerRect.top + (triggerRect.height - popupRect.height) / 2

	if (placement === 'top') {
		return { top: triggerRect.top - popupRect.height, left: centeredLeft }
	}
	if (placement === 'left') {
		return { top: centeredTop, left: triggerRect.left - popupRect.width }
	}
	if (placement === 'right') {
		return { top: centeredTop, left: triggerRect.right }
	}
	return { top: triggerRect.bottom, left: centeredLeft }
}

const updatePosition = async () => {
	await nextTick()

	if (!rootEl.value || !popupEl.value) return

	const triggerRect = rootEl.value.getBoundingClientRect()
	const popupRect = popupEl.value.getBoundingClientRect()
	const { top, left } = getTooltipPosition(triggerRect, popupRect, props.placement ?? 'top')

	tooltipStyle.value = {
		top: `${top}px`,
		left: `${left}px`,
	}
}

const onEnter = () => {
	// Block the synthesized mouseenter that touch browsers fire after a tap
	if (Date.now() - lastTouchEnd < 600) return
	input.value = 'mouse'
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
	input.value = 'touch'
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
@layer ui {
	.tooltip-root {
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
		--tooltip-gap: var(--sf-spacing-xs);
	}

	/* A touch-opened tooltip above the target sits well clear so the thumb resting
	   on the target doesn't cover it. */
	.tooltip-popup[data-input='touch'][data-placement='top'] {
		--tooltip-gap: 40px;
	}

	.tooltip-popup[data-placement='top'] {
		translate: 0 calc(-1 * var(--tooltip-gap));
	}
	.tooltip-popup[data-placement='bottom'] {
		translate: 0 var(--tooltip-gap);
	}
	.tooltip-popup[data-placement='left'] {
		translate: calc(-1 * var(--tooltip-gap)) 0;
	}
	.tooltip-popup[data-placement='right'] {
		translate: var(--tooltip-gap) 0;
	}
}
</style>
