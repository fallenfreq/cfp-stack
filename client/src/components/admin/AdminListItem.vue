<template>
	<tr class="admin-row">
		<td class="admin-cell">
			<span class="admin-cell__name">{{ name || '—' }}</span>
		</td>
		<td class="admin-cell">
			<code class="admin-cell__slug sf-loudness-1">/{{ slug }}</code>
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
		<td class="admin-cell admin-cell--narrow admin-cell--sticky sf-boundary-left">
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
	.admin-cell--sticky {
		position: sticky;
		right: 0;
		width: 48px;
		background: inherit;
		z-index: 2;
	}

	.admin-cell__name {
		font-weight: 500;
		white-space: nowrap;
	}

	.admin-cell__slug {
		font-family: monospace;
		font-size: 0.75rem;
		white-space: nowrap;
	}

	/* Slot content API — non-scoped so it applies inside action slots */
	.admin-action {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-radius: 4px;
		padding: 6px 10px;
		font-size: 0.875rem;
		cursor: pointer;
		color: inherit;
		text-decoration: none;
	}
}
</style>
