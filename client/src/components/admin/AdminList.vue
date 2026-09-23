<template>
	<div>
		<!-- sl-cover with a compact override so the state message reserves a proper
		     empty-state region without filling the viewport (default 100dvh would
		     push the page header off-screen). -->
		<div v-if="loading" class="sl-cover sf-text-sm sf-loudness-1" style="--sl-cover-min: 20rem">
			Loading…
		</div>
		<div
			v-else-if="empty"
			class="sl-cover sf-text-sm sf-loudness-1"
			style="--sl-cover-min: 20rem"
		>
			<slot name="empty">Nothing here yet.</slot>
		</div>
		<div
			v-else
			class="sf-depth-1 sf-size-2xs"
			:class="{
				'sf-is-edge-left': isBelowThreshold,
				'sf-is-edge-right': isBelowThreshold,
				'admin-table-wrap--full-bleed': isBelowThreshold,
			}"
		>
			<div
				ref="tableWrap"
				class="sl-scroll-x"
				:class="{
					'sf-is-overflow-left': isOverflowLeft,
					'sf-is-overflow-right': isOverflowRight,
				}"
			>
				<table class="admin-table sf">
					<thead>
						<tr>
							<slot name="header" />
						</tr>
					</thead>
					<tbody>
						<slot />
					</tbody>
				</table>
			</div>
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
const { left: isOverflowLeft, right: isOverflowRight } = useScrollOverflow(tableWrap)
</script>

<style>
@layer ui {
	.admin-table-wrap--full-bleed {
		margin: 0 -1.25rem;
	}

	.admin-table {
		width: 100%;
	}
}
</style>
