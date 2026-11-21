<template>
	<!-- A mark on what's inside, saying there's something there to look at: a count over it, or with
	     none a mark alone. The theme decides their shape and where they sit; this box only gives
	     them something to sit against. It's for sight only, so whoever uses a badge says what it
	     means in words too (a name, or the item it points to). -->
	<span class="badge-anchor">
		<slot />
		<span
			v-if="count !== 0"
			:class="[
				count === undefined ? 'sf-badge' : 'sf-counter sf-is-overlay sf-single-line',
				loudness && `sf-loudness-${loudness}`,
				variant && `sf-variant-${variant}`,
			]"
			aria-hidden="true"
			v-bind="$attrs"
			>{{ count }}</span
		>
	</span>
</template>

<script setup lang="ts">
import type { ButtonLoudness, ButtonVariant } from './SfButton.vue'

// Attributes and classes describe the mark (when it shows, say), not the box around the content.
defineOptions({ inheritAttrs: false })
const { count = undefined } = defineProps<{
	// The number it shows; 0 shows nothing, and none shows a dot.
	count?: number | undefined
	loudness?: ButtonLoudness | undefined
	variant?: ButtonVariant | undefined
}>()
</script>

<style scoped>
@layer ui {
	.badge-anchor {
		position: relative;
		display: inline-flex;
	}
}
</style>
