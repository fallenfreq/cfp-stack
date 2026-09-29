<template>
	<!-- The one button. The theme styles every button.sf; this sets the defaults and
	     behaviour. Other attributes, listeners and classes pass through to the button. -->
	<button
		ref="el"
		:type="type"
		class="btn sf sf-on-disabled"
		:class="[
			loudness && `sf-loudness-${loudness}`,
			variant && `sf-variant-${variant}`,
			size && `sf-size-${size}`,
			{
				'sf-on-current': current,
				'sf-is-loading': loading,
				'sf-on-hover': !isDisabled,
			},
		]"
		:disabled="disabled && !loading"
		:aria-disabled="loading || undefined"
		:aria-busy="loading || undefined"
		@click.capture="onPress"
		@focus="onFocus"
	>
		<slot />
	</button>
</template>

<script setup lang="ts">
import { announce } from '@/services/announce'
import { computed, ref, watch } from 'vue'

export type ButtonLoudness = 1 | 2 | 3
export type ButtonVariant =
	| 'featured'
	| 'primary'
	| 'danger'
	| 'warning'
	| 'success'
	| 'info'
	| 'alt-1'
export type ButtonSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
	defineProps<{
		// No loudness means the theme's plain button, as no size means its normal size.
		loudness?: ButtonLoudness | undefined
		variant?: ButtonVariant | undefined
		// No size means the theme's normal button size.
		size?: ButtonSize | undefined
		// Marks the button as the one that's on or selected (a pressed toggle, the open tab).
		current?: boolean
		// Waiting on its action: shows as busy and can't be pressed again. It is never
		// natively disabled while busy, even with `disabled` set, because a disabled button
		// drops focus; aria-disabled tells assistive tech instead, and the click (mouse,
		// touch, Enter, Space, form submit) is stopped before any handler runs. Handlers on
		// other events (mousedown, keydown) are the caller's to guard.
		loading?: boolean
		disabled?: boolean
		// A button's own default is "submit", which submits any form it sits in.
		type?: 'button' | 'submit' | 'reset'
	}>(),
	{ type: 'button' },
)

const isDisabled = computed(() => props.disabled || props.loading)

// Tell screen readers the button they're on is busy (aria-busy alone is mostly not read):
// when it goes busy while focused, and when focus lands on it while busy (tabbing to it, or
// focus coming back from a dialog). Busy buttons elsewhere on the page stay quiet.
const el = ref<HTMLButtonElement | null>(null)
watch(
	() => props.loading,
	(busy) => {
		if (busy && el.value && el.value === document.activeElement) announce('Loading')
	},
)
const onFocus = () => {
	if (props.loading) announce('Loading')
}

// Runs before the consumer's click. While busy it stops that click (and a submit button
// submitting); otherwise it makes sure the pressed button has focus.
const onPress = (event: MouseEvent) => {
	if (props.loading) {
		event.preventDefault()
		event.stopImmediatePropagation()
		return
	}
	// Safari and Firefox on macOS don't focus a clicked button: focus falls to whatever
	// around it can hold focus (the page, a scroll area, a popover). Take it, as other
	// browsers do, so the button in use is the focused one (the busy announcement relies on
	// that). A button that keeps focus elsewhere on purpose (mousedown.prevent) leaves it
	// there: focus stayed on something that doesn't contain the button.
	const button = el.value
	const active = document.activeElement
	if (button && active !== button && (!active || active.contains(button))) {
		button.focus({ preventScroll: true })
	}
}
</script>

<style scoped>
@layer ui {
	/* Icon and text sit in a row, centred. :where() keeps this as weak as a rule can be,
	   so wherever a button sits (a menu, a table cell) can line its contents up otherwise. */
	:where(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		white-space: nowrap;
	}
}
</style>
