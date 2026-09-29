<template>
	<!-- On phones the table reaches the edges of the page's sl-inset; loading and empty
	     messages stay on the page line. -->
	<div :class="{ 'sl-bleed': isBelowThreshold && !loading && !empty }">
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
				'sf-flush': isBelowThreshold,
				'sf-is-edge-left': isBelowThreshold,
				'sf-is-edge-right': isBelowThreshold,
			}"
		>
			<!-- On phones the card is flush and the scroll area carries the page line, so rows
			     start in line with the page text and scroll out to the screen edge. -->
			<div
				ref="tableWrap"
				class="sl-scroll-x"
				:class="{
					'sl-inset-line': isBelowThreshold,
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
	.admin-table {
		width: 100%;
	}
	/* Headers stay on one line (the table scrolls sideways instead) and aren't picked up
	   when selecting rows of text. */
	.admin-table th {
		white-space: nowrap;
		user-select: none;
	}
}
</style>
