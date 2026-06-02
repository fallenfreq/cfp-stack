<template>
	<div
		class="layout-columns"
		:class="collapse !== 'never' ? `collapse-${collapse}` : ''"
		:style="{ '--cols': columns, '--gap': SPACING[gap], '--align': align }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { SPACING } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	columns: { type: String as PropType<'2' | '3' | '4'>, default: '2' },
	gap: { type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>, default: 'md' },
	collapse: { type: String as PropType<'never' | 'xs' | 'sm' | 'md'>, default: 'sm' },
	align: {
		type: String as PropType<'start' | 'center' | 'end' | 'stretch'>,
		default: 'stretch',
	},
})
</script>

<style scoped>
.layout-columns {
	container-type: inline-size;
	width: 100%;
}

:global(.layout-columns > [data-node-view-content]) {
	display: grid;
	grid-template-columns: repeat(var(--cols), 1fr);
	gap: var(--gap);
	align-items: var(--align, stretch);
}

:global(.layout-columns > [data-node-view-content] > *) {
	margin-bottom: 0;
}

/* breakpoint values match --xs/--sm/--md in src/assets/base.css */
:global(.layout-columns.collapse-xs > [data-node-view-content]) {
	@container (max-width: 380px) {
		grid-template-columns: 1fr;
	}
}

:global(.layout-columns.collapse-sm > [data-node-view-content]) {
	@container (max-width: 640px) {
		grid-template-columns: 1fr;
	}
}

:global(.layout-columns.collapse-md > [data-node-view-content]) {
	@container (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}
</style>
