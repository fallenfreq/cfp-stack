<template>
	<tr>
		<td>
			<span class="sf-loudness-3" style="white-space: nowrap">{{ name || '—' }}</span>
		</td>
		<td>
			<code class="sf sf-loudness-1 sf-text-xs" style="white-space: nowrap">/{{ slug }}</code>
		</td>
		<td>
			<slot name="meta" />
		</td>
		<!-- width: 1px — table idiom: the column shrinks to fit its control. -->
		<td style="width: 1px">
			<SfSwitch
				:model-value="published"
				aria-label="Published"
				@update:model-value="$emit('update:published', $event)"
			/>
		</td>
		<td class="sl-pin-right sf-boundary-left" style="width: 1px">
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
