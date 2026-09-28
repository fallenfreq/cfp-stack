<template>
	<!-- The one button. The theme styles every button.sf; this sets the defaults and
	     behaviour. Other attributes, listeners and classes pass through to the button. -->
	<button
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
		:disabled="isDisabled"
		:aria-busy="loading || undefined"
	>
		<slot />
	</button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
		loudness?: ButtonLoudness
		variant?: ButtonVariant
		// No size means the theme's normal button size.
		size?: ButtonSize
		// Marks the button as the one that's on or selected (a pressed toggle, the open tab).
		current?: boolean
		// Waiting on its action: shows as busy and can't be pressed again.
		loading?: boolean
		disabled?: boolean
		// A button's own default is "submit", which submits any form it sits in.
		type?: 'button' | 'submit' | 'reset'
	}>(),
	{ type: 'button' },
)

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<style scoped>
@layer ui {
	/* Icon and text sit in a row, centred. */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		white-space: nowrap;
	}
}
</style>
