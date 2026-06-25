<template>
	<div class="layout-card sf-depth-1" :class="`sf-variant-${variant}`">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
	variant: {
		type: String as PropType<'elevated' | 'outlined' | 'filled' | 'plain' | 'featured'>,
		default: 'elevated',
	},
})
</script>

<style scoped>
.layout-card {
	container-type: inline-size;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

:global(.layout-card > [data-node-view-content]) {
	display: block; /* defensive reset — prevents inherited grid/flex */
	padding: var(--sf-padding, 0);
}

/* Temporary in-component CSS — these variants add to or override what sf-depth-1 provides.
   Move to DB once the variant vocabulary is extended to cover these cases. */

/* elevated adds a border on top of depth-1's shadow; the two together give a crisp edge */
.layout-card.sf-variant-elevated {
	border: 1px solid rgb(var(--sf-border_color));
}

/* outlined replaces the shadow with a border and clears the depth-1 shadow */
.layout-card.sf-variant-outlined {
	box-shadow: none;
	border: 1px solid rgb(var(--sf-border_color));
}

/* filled: depth-1 background only — no shadow, no border */
.layout-card.sf-variant-filled {
	box-shadow: none;
}

/* plain: no surface treatment at all */
.layout-card.sf-variant-plain {
	background: none;
	box-shadow: none;
	border-radius: 0;
}

/* featured: transparent primary tint + primary border, no depth shadow */
.layout-card.sf-variant-featured {
	background: rgb(var(--sf-primary) / var(--sf-alpha-2, 0.2));
	border: 1px solid rgb(var(--sf-primary) / var(--sf-alpha-5, 0.5));
	box-shadow: none;
	color: inherit;
}
</style>
