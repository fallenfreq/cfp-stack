<template>
	<div class="page-shell sl-inset sf-gap-lg">
		<div class="page-header sl-cluster sf-gap-sm">
			<!-- `header` replaces the plain title when a page needs more (e.g. an avatar). -->
			<slot name="header">
				<h1 class="sf-heading-1">{{ title }}</h1>
			</slot>
			<slot name="actions" />
		</div>
		<slot />
	</div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<style scoped>
@layer ui {
	/* Side margins are the theme's page margin (sl-inset). Top padding is this shell's
	   own spacing choice — nothing lines up with it. */
	.page-shell {
		padding-block-start: var(--sf-spacing-lg);
	}
	/* Title-left / actions-right with wrap on narrow viewports.
	   sl-cluster covers flex + wrap + gap; component picks justification + alignment. */
	.page-header {
		justify-content: space-between;
		align-items: center;
	}
}
</style>
