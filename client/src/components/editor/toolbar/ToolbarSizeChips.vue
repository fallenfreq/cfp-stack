<template>
	<div class="size-chips">
		<span class="sf-loudness-1">{{ label }}</span>
		<div class="size-chips-row">
			<SfChip
				size="xs"
				:selected="value === null && !ownSize"
				@mousedown.prevent
				@click="$emit('pick', null)"
			>
				none
			</SfChip>
			<SfChip
				v-for="size in options"
				:key="size"
				size="xs"
				:selected="value === size"
				@mousedown.prevent
				@click="$emit('pick', size)"
			>
				{{ size }}
			</SfChip>
		</div>
	</div>
</template>

<script setup lang="ts">
import SfChip from '@/components/SfChip.vue'

// A row of the theme's sizes for one setting, after "none", which takes the setting off.
defineProps<{
	label: string
	/** The theme's sizes. */
	options: readonly string[]
	/** The size the block wears, or null for none. One the theme doesn't have lights no chip. */
	value: string | null
	/** The block has a size of its own in its style, so "none" isn't lit either. */
	ownSize?: boolean
}>()

defineEmits<{ pick: [size: string | null] }>()
</script>

<style scoped>
@layer ui {
	.size-chips {
		display: flex;
		flex-direction: column;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	.size-chips-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		flex-wrap: wrap;
	}
}
</style>
