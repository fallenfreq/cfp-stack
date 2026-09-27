<template>
	<span
		class="tooltip-root"
		:style="`anchor-name: ${anchor}`"
		:aria-describedby="text ? id : undefined"
		@mouseenter="onEnter"
		@mouseleave="onLeave"
		@touchstart.passive="onTouchStart"
		@touchend="onTouchEnd"
		@touchcancel="onTouchEnd"
	>
		<slot />
		<!-- A manual popover in the top layer, so it shows above open panels and menus too. -->
		<span
			v-if="text"
			:id="id"
			ref="popupEl"
			popover="manual"
			role="tooltip"
			class="tooltip-popup sf sf-text-block sf-text-xs sf-depth-3 sf-size-2xs sf-is-overlay"
			:data-placement="placement ?? 'top'"
			:data-input="input"
			:style="`position-anchor: ${anchor}`"
		>
			{{ text }}
		</span>
	</span>
</template>

<script setup lang="ts">
import { onUnmounted, ref, useId, watch } from 'vue'

const props = defineProps<{
	text: string
	placement?: 'top' | 'bottom' | 'left' | 'right'
	delay?: number
}>()

const id = useId()
const anchor = `--${id}`
const visible = ref(false)
const popupEl = ref<HTMLElement | null>(null)
// How the tooltip was opened; the CSS widens the gap for touch.
const input = ref<'mouse' | 'touch'>('mouse')
let timer: ReturnType<typeof setTimeout> | null = null
let lastTouchEnd = 0

watch(visible, (show) => {
	const el = popupEl.value
	if (!el?.isConnected || el.matches(':popover-open') === show) return
	if (show) el.showPopover()
	else el.hidePopover()
})

const onEnter = () => {
	// Block the synthesized mouseenter that touch browsers fire after a tap
	if (Date.now() - lastTouchEnd < 600) return
	input.value = 'mouse'
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
	if (timer) {
		clearTimeout(timer)
		timer = null
	}
	input.value = 'touch'
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

	/* Placed against the trigger on the chosen side, centred on it and slid back on
	   screen at the edges; flipped to the other side when there's no room. The gap is
	   the margin on the side facing the trigger. */
	.tooltip-popup {
		margin: 0;
		overflow: visible;
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
		position-area: top;
		margin-bottom: var(--tooltip-gap);
		position-try-fallbacks: flip-block;
	}
	.tooltip-popup[data-placement='bottom'] {
		position-area: bottom;
		margin-top: var(--tooltip-gap);
		position-try-fallbacks: flip-block;
	}
	.tooltip-popup[data-placement='left'] {
		position-area: left;
		margin-right: var(--tooltip-gap);
		position-try-fallbacks: flip-inline;
	}
	.tooltip-popup[data-placement='right'] {
		position-area: right;
		margin-left: var(--tooltip-gap);
		position-try-fallbacks: flip-inline;
	}
}
</style>
