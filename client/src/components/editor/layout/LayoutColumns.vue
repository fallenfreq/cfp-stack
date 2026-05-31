<template>
	<div
		class="layout-columns"
		:class="collapse !== 'never' ? `collapse-${collapse}` : ''"
		:style="{ '--cols': columns, '--gap': SPACING[gap] }"
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
})
</script>

<style scoped>
.layout-columns {
	container-type: inline-size;
	width: 100%;
}

.layout-columns :deep([data-node-view-content]) {
	display: grid;
	grid-template-columns: repeat(var(--cols), 1fr);
	gap: var(--gap);
}

/* breakpoint values match --xs/--sm/--md in src/assets/base.css */
.layout-columns.collapse-xs :deep([data-node-view-content]) {
	@container (max-width: 380px) {
		grid-template-columns: 1fr;
	}
}

.layout-columns.collapse-sm :deep([data-node-view-content]) {
	@container (max-width: 640px) {
		grid-template-columns: 1fr;
	}
}

.layout-columns.collapse-md :deep([data-node-view-content]) {
	@container (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}
</style>
