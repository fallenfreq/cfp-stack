<template>
	<tr class="admin-row">
		<td class="admin-cell">
			<span class="sf-loudness-3" style="white-space: nowrap">{{ name || '—' }}</span>
		</td>
		<td class="admin-cell">
			<code class="sf sf-loudness-1 sf-text-xs" style="white-space: nowrap">/{{ slug }}</code>
		</td>
		<td class="admin-cell">
			<slot name="meta" />
		</td>
		<td class="admin-cell admin-cell--narrow">
			<VaSwitch
				:model-value="published"
				size="small"
				@update:model-value="($event: boolean) => $emit('update:published', $event)"
			/>
		</td>
		<td class="admin-cell admin-cell--narrow admin-cell--actions sl-pin-right sf-boundary-left">
			<SfOverflowMenu tooltip="Actions">
				<slot name="actions" />
			</SfOverflowMenu>
		</td>
	</tr>
</template>

<script setup lang="ts">
defineProps<{ name: string; slug: string; published: boolean }>()
defineEmits<{ 'update:published': [value: boolean] }>()
</script>

<style>
@layer ui {
	.admin-cell--narrow {
		width: 1px;
		white-space: nowrap;
	}
	.admin-cell--actions {
		width: 48px;
	}
}
</style>
