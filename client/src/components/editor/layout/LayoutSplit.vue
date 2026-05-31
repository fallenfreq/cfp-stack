<template>
	<div
		class="layout-split"
		:class="collapse !== 'never' ? `collapse-${collapse}` : ''"
		:style="{ '--split-template': SPLIT_TEMPLATES[split], '--gap': SPACING[gap] }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { SPACING, SPLIT_TEMPLATES } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	split: {
		type: String as PropType<'1/4' | '1/3' | '2/5' | '1/2' | '3/5' | '2/3' | '3/4'>,
		default: '1/3',
	},
	gap: { type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>, default: 'md' },
	collapse: { type: String as PropType<'never' | 'xs' | 'sm' | 'md'>, default: 'sm' },
})
</script>

<style scoped>
.layout-split {
	container-type: inline-size;
	width: 100%;
}

.layout-split :deep([data-node-view-content]) {
	display: grid;
	grid-template-columns: var(--split-template);
	gap: var(--gap);
}

/* breakpoint values match --xs/--sm/--md in src/assets/base.css */
.layout-split.collapse-xs :deep([data-node-view-content]) {
	@container (max-width: 380px) {
		grid-template-columns: 1fr;
	}
}

.layout-split.collapse-sm :deep([data-node-view-content]) {
	@container (max-width: 640px) {
		grid-template-columns: 1fr;
	}
}

.layout-split.collapse-md :deep([data-node-view-content]) {
	@container (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}
</style>
