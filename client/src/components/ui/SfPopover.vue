<template>
	<slot name="trigger" v-bind="trigger" />
	<div
		v-bind="$attrs"
		:id="id"
		popover="auto"
		class="popover-box sf-depth-2 sf-is-overlay"
		:data-align="align"
		:style="`position-anchor: ${anchor}`"
		@click="onClick"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

// A box that opens from a button, over everything, and closes on Esc or a click outside
// (the browser's own popover). The consumer's own button opens it: spread the trigger slot
// props onto it. The box follows the trigger in the DOM, so Tab moves from the trigger into
// the content, and it still inherits from where it sits (colour, context selectors).
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

const onClick = (event: MouseEvent) => {
	if (props.closeOnClick && (event.target as Element).closest('a, button'))
		(event.currentTarget as HTMLElement).hidePopover()
}
</script>

<style scoped>
@layer ui {
	/* Below the trigger, or above when there's no room below. Without anchor positioning
	   the browser centres the box on screen instead, so the margin reset lives in here too. */
	@supports (position-area: block-end) {
		.popover-box {
			margin: 0;
			margin-block-start: var(--sf-spacing-2xs);
			position-area: block-end span-inline-end;
			position-try-fallbacks:
				flip-block,
				flip-inline,
				flip-block flip-inline;
		}

		.popover-box[data-align='end'] {
			position-area: block-end span-inline-start;
		}
	}
}
</style>
