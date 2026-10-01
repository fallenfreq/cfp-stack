<template>
	<div class="page-shell sl-inset sf-gap-lg">
		<!-- None for a stored page: its content brings its own title. -->
		<div
			v-if="title || $slots.header || $slots.actions"
			class="page-header sl-cluster sf-gap-sm"
		>
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
	/* Title-left / actions-right with wrap on narrow viewports.
	   sl-cluster covers flex + wrap + gap; component picks justification + alignment. */
	.page-header {
		justify-content: space-between;
		align-items: center;
	}
}
</style>
