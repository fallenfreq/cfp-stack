<template>
	<div class="page-shell sl-inset sf-padding-lg sf-gap-lg">
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
	/* Side margins come from sl-inset + sf-padding-lg; top padding stays here until
	   [[project-sl-padding]] lands. */
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
