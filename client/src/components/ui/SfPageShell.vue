<template>
	<div class="page-shell sl-stack sf-gap-lg">
		<div class="page-header sl-cluster sf-gap-sm">
			<h1 class="sf-heading-1">{{ title }}</h1>
			<slot name="actions" />
		</div>
		<slot />
	</div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style scoped>
@layer ui {
	/* Edge padding — migrate to sl-pad-* once [[project-sl-padding]] lands. */
	.page-shell {
		padding-inline: var(--sf-spacing-lg);
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
