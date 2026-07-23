<template>
	<SfTooltip :text="tooltip">
		<button
			class="fa-icon-btn sf sf-on-hover sf-on-disabled"
			:class="`sf-size-${size}`"
			v-bind="$attrs"
		>
			<FaIcon :name="icon" />
		</button>
	</SfTooltip>
</template>

<script setup lang="ts">
import type { IconName } from './FaIcon.vue'

defineOptions({ inheritAttrs: false })
withDefaults(
	defineProps<{
		icon: IconName
		tooltip: string
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	}>(),
	{ size: 'xs' },
)
</script>

<style>
@layer ui {
	.fa-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
}
</style>
