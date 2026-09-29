<template>
	<!-- With label text the whole row is the label; without it, pass aria-label. -->
	<component :is="$slots.default ? 'label' : 'span'" class="sl-cluster sf-gap-xs">
		<button
			v-bind="$attrs"
			type="button"
			role="switch"
			:aria-checked="on"
			:disabled="disabled"
			class="switch-track sf sf-switch sf-on-focus sf-on-disabled"
			:class="{ 'sf-on-current': on, 'sf-on-hover': !disabled, 'sf-on-active': !disabled }"
			@click="on = !on"
		>
			<span
				v-if="$slots.off"
				class="switch-mark switch-mark-off sf-icon sf-loudness-1"
				aria-hidden="true"
			>
				<slot name="off" />
			</span>
			<span
				v-if="$slots.on"
				class="switch-mark switch-mark-on sf-icon sf-loudness-1"
				aria-hidden="true"
			>
				<slot name="on" />
			</span>
			<span class="switch-knob sf-thumb" :class="{ 'sf-on-current': on }" aria-hidden="true">
				<slot name="thumb" :on="on" />
			</span>
		</button>
		<slot />
	</component>
</template>

<script setup lang="ts">
// An on/off switch. Its track and knob are themed as sf-switch and sf-thumb. The knob can
// hold an icon (thumb slot), which gets whether the switch is on. The off and on slots put
// quieter icons at the track's two ends; only the one the knob isn't covering shows, so
// you see what the switch would change to. Class and attributes land on the switch
// itself, so aria-label and sf-text-* reach it.
defineOptions({ inheritAttrs: false })
defineProps<{ disabled?: boolean }>()
const on = defineModel<boolean>({ default: false })
</script>

<style>
@layer ui {
	/* One row, two halves: an end icon centred in each, the knob over both. */
	.switch-track {
		display: inline-grid;
		grid-template-columns: 1fr 1fr;
		align-items: center;
		flex: none;
	}
	.switch-track > * {
		grid-row: 1;
	}
	.switch-mark {
		display: inline-flex;
		justify-self: center;
	}
	.switch-mark-off {
		grid-column: 1;
	}
	.switch-mark-on {
		grid-column: 2;
	}
	/* The knob covers its own end; that end's icon hides rather than show through. */
	.switch-track[aria-checked='false'] > .switch-mark-off,
	.switch-track[aria-checked='true'] > .switch-mark-on {
		visibility: hidden;
	}

	/* The knob starts at the track's inner start edge and slides to its end edge,
	   whatever size the theme gives either. */
	.switch-knob {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		grid-column: 1 / -1;
		justify-self: start;
		position: relative;
		inset-inline-start: 0;
		transition:
			var(--transition),
			inset-inline-start 0.2s ease,
			translate 0.2s ease;
	}
	.switch-track[aria-checked='true'] > .switch-knob {
		inset-inline-start: 100%;
		translate: -100%;
	}
	.switch-track[aria-checked='true']:dir(rtl) > .switch-knob {
		translate: 100%;
	}
}
</style>
