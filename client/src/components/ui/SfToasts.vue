<template>
	<!-- In the top layer, so the messages show above everything without a z-index. -->
	<div
		ref="region"
		popover="manual"
		class="toast-region"
		aria-live="polite"
		@pointerenter="holdToasts('hover', true)"
		@pointerleave="holdToasts('hover', false)"
		@focusin="holdToasts('focus', true)"
		@focusout="onFocusOut"
	>
		<div class="sl-stack sf-gap-xs">
			<div
				v-for="toast in toasts"
				:key="toast.id"
				class="toast sf-toast sf-depth-3 sf-is-overlay sf-loudness-2 sf-size-sm sl-split sl-align-y-center sf-gap-sm"
				:class="toast.variant && `sf-variant-${toast.variant}`"
				:role="toast.variant === 'danger' ? 'alert' : undefined"
			>
				<p class="toast-message">{{ toast.message }}</p>
				<SfIconButton
					icon="x"
					tooltip="Dismiss"
					class="sf-is-contained sf-loudness-1"
					@click="dismiss(toast.id)"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { dismiss, holdToasts, toasts } from '@/services/toast'
import { onMounted, ref, watch } from 'vue'

// The one place toasts show; mounted once in App. notify() from services/toast adds them.
const region = ref<HTMLElement | null>(null)

// Showing again moves the region back to the top of the top layer, above any dialog
// opened since.
const bringToFront = () => {
	const el = region.value
	if (!el) return
	if (el.matches(':popover-open')) el.hidePopover()
	el.showPopover()
}
onMounted(bringToFront)
watch(
	() => toasts.length,
	(length, previous) => length > previous && bringToFront(),
)

const onFocusOut = (event: FocusEvent) => {
	if (!region.value?.contains(event.relatedTarget as Node | null)) holdToasts('focus', false)
}
</script>

<style scoped>
@layer ui {
	/* Bottom corner, off the screen edges by the page margin; clear of the browser's
	   popover box styles. */
	.toast-region {
		inset: auto var(--sf-spacing_page) var(--sf-spacing_page) auto;
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		overflow: visible;
		inline-size: min(24rem, 100% - 2 * var(--sf-spacing_page));
	}

	/* Message takes the width, the close button keeps its own. */
	.toast {
		--sl-template: 1fr auto;
	}

	/* Messages may hold line breaks. */
	.toast-message {
		white-space: pre-line;
	}
}
</style>
