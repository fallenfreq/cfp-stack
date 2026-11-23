<template>
	<!-- A mark on what's inside, saying there's something there to look at: a count over it, or with
	     none a mark alone. This box holds both, so the mark sits on its top end corner (sl-over and
	     the align words); the theme draws the mark and how far it pokes out. It's for sight only,
	     so whoever uses a badge says what it means in words too (a name, or the item it points
	     to). -->
	<span class="badge-anchor">
		<slot />
		<span
			v-if="count !== 0"
			:class="[
				count === undefined ? 'sf-badge' : 'sf-counter sf-single-line',
				'sl-over sl-align-x-end sl-align-y-start sf-is-overlay',
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
	/* As big as what's inside, so the corner is its corner. */
	.badge-anchor {
		display: inline-flex;
	}
}
</style>
