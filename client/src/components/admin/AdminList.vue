<template>
	<div>
		<div v-if="loading" class="admin-list__state">Loading…</div>
		<div v-else-if="empty" class="admin-list__state">
			<slot name="empty">Nothing here yet.</slot>
		</div>
		<div
			v-else
			ref="tableWrap"
			class="admin-table-wrap sf-depth-1"
			:class="{
				'sf-is-edge-left': isBelowThreshold,
				'sf-is-edge-right': isBelowThreshold,
				'admin-table-wrap--full-bleed': isBelowThreshold,
				'sf-is-overflow-left': isOverflowLeft,
			}"
		>
			<table class="admin-table">
				<thead>
					<tr class="admin-table__head">
						<slot name="header" />
					</tr>
				</thead>
				<tbody>
					<slot />
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useCollapseBreakpoint } from '@/composables/useCollapseBreakpoint'
import { useScrollOverflow } from '@/composables/useScrollOverflow'
import { ref } from 'vue'

defineProps<{ loading?: boolean; empty?: boolean }>()
const { isBelowThreshold } = useCollapseBreakpoint('sm')

const tableWrap = ref<HTMLElement | null>(null)
const { left: isOverflowLeft } = useScrollOverflow(tableWrap)
</script>

<style>
@layer ui {
	.admin-list__state {
		opacity: 0.5;
		padding: 12px 4px;
		font-size: 0.875rem;
	}

	.admin-table-wrap {
		overflow-x: auto;
		scrollbar-width: none;
	}
	.admin-table-wrap::-webkit-scrollbar {
		display: none;
	}

	.admin-table-wrap--full-bleed {
		margin: 0 -1.25rem;
	}

	.admin-table {
		width: 100%;
		font-size: 0.875rem;
	}

	.admin-table__head th:last-child {
		position: sticky;
		right: 0;
		z-index: 2;
		background: inherit;
	}

	.admin-table-wrap.sf-is-overflow-left .admin-table__head th:last-child,
	.admin-table-wrap.sf-is-overflow-left .admin-cell--sticky {
		box-shadow: -6px 0 10px rgb(var(--sf-shadow) / var(--sf-shadow-opacity));
	}
}
</style>
