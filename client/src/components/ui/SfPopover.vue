<template>
	<slot name="trigger" v-bind="trigger" />
	<div
		v-bind="$attrs"
		:id="id"
		ref="box"
		popover="auto"
		class="popover-box sf-depth-2 sf-is-overlay"
		:data-align="align"
		:style="`position-anchor: ${anchor}`"
		@beforetoggle="onBeforeToggle"
		@toggle="onToggle"
		@click="onClick"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { useAnchorFallback } from '@/composables/useAnchorFallback'
import { onMounted, ref, useId, watch } from 'vue'

// A box that opens from a button, over everything, and closes on Esc or a click outside
// (the browser's own popover). The consumer's own button opens it: spread the trigger slot
// props onto it. The box follows the trigger in the DOM, so Tab moves from the trigger into
// the content, and it still inherits from where it sits (colour, context selectors).
// v-model:open is optional: it reports every open and close (trigger, Esc, a click
// outside) before the box paints, and setting it opens or closes the box from script.
// Classes given to SfPopover land on the box — e.g. a size. Never give the box a display
// class (sl-stack…): it would show the closed popover. Nest the layout inside instead.
defineOptions({ inheritAttrs: false })
const props = withDefaults(
	defineProps<{
		// Which edge of the trigger the box lines up with.
		align?: 'start' | 'end'
		// Close when a link or button inside is clicked — for menus of actions.
		closeOnClick?: boolean
	}>(),
	{ align: 'start', closeOnClick: false },
)

const id = useId()
const anchor = `--${id}`
const trigger = { popovertarget: id, style: `anchor-name: ${anchor}` }

const open = defineModel<boolean>('open', { default: false })
const box = ref<HTMLElement | null>(null)

// Between beforetoggle and toggle the box is changing state; Vue's watcher runs in that
// gap, so it goes by the state on its way rather than calling show/hide a second time.
let changingTo: boolean | null = null
const onBeforeToggle = (event: Event) => {
	changingTo = (event as ToggleEvent).newState === 'open'
	open.value = changingTo
}
const onToggle = () => {
	changingTo = null
	sync()
}

// Only act when the box is out of step: removing a shown box hides it without any event.
const sync = () => {
	const el = box.value
	if (!el?.isConnected || (changingTo ?? el.matches(':popover-open')) === open.value) return
	if (open.value) el.showPopover()
	else el.hidePopover()
}
watch(open, sync)
onMounted(sync)

// Browsers without anchor positioning get the CSS's placement from script, with its spacing.
useAnchorFallback(
	box,
	() => document.querySelector(`[popovertarget="${CSS.escape(id)}"]`),
	() => ({
		side: 'bottom',
		align: props.align,
		gap: 'var(--sf-spacing-2xs)',
		edge: 'var(--sf-spacing_page)',
		wide: true,
		fitScreen: true,
	}),
)

const onClick = (event: MouseEvent) => {
	if (props.closeOnClick && (event.target as Element).closest('a, button'))
		(event.currentTarget as HTMLElement).hidePopover()
}
</script>

<style scoped>
@layer ui {
	/* Below the trigger, lined up with its edge; else the other edge, else above. A box
	   too wide for either side spans the screen width instead, centred on the trigger and
	   slid back on screen at the edges. The box keeps its content width, so it moves on
	   rather than squeezing into a narrow gap. Where it fits nowhere, it stays where it last
	   fitted (else below) and scrolling the page brings it into view: it's never taller than
	   the screen less its trigger, so it fits once the trigger reaches a screen edge. Not at
	   the end of a page, which only the editor lets you scroll past (App.vue). Chrome
	   tries only five fallbacks, the fewest the spec allows, so the list stops at five.
	   Without anchor positioning, useAnchorFallback places it by the same rules. */
	@supports (position-area: block-end) {
		.popover-box {
			margin: 0;
			margin-block-start: var(--sf-spacing-2xs);
			inline-size: max-content;
			max-block-size: calc(100dvh - anchor-size(block) - 2 * var(--sf-spacing-2xs));
			position-area: block-end span-inline-end;
			position-try-fallbacks:
				flip-inline,
				flip-block,
				flip-block flip-inline,
				--popover-below-wide,
				--popover-above-wide;
		}

		.popover-box[data-align='end'] {
			position-area: block-end span-inline-start;
		}
	}
}

/* The wide options: here 100% is the screen width, less the page margin each side. */
@position-try --popover-below-wide {
	position-area: block-end span-all;
	margin: var(--sf-spacing-2xs) var(--sf-spacing_page) 0;
	max-inline-size: calc(100% - 2 * var(--sf-spacing_page));
}

@position-try --popover-above-wide {
	position-area: block-start span-all;
	margin: 0 var(--sf-spacing_page) var(--sf-spacing-2xs);
	max-inline-size: calc(100% - 2 * var(--sf-spacing_page));
}
</style>

<style>
/* The consumer's trigger, positioned: Safari 26 places a box anchored to an unpositioned element
   in a fixed bar (the floating toolbar, a sheet) as though the bar scrolled with the page. A
   theme's own position wins; only static would bring that back. */
@layer ui {
	:where([popovertarget]) {
		position: relative;
	}
}
</style>
