<template>
	<SfTooltip :text="tooltip">
		<button
			class="sf-icon-btn sf sf-on-hover sf-on-disabled"
			:class="`sf-size-${size}`"
			v-bind="$attrs"
		>
			<SfIcon :name="icon" />
		</button>
	</SfTooltip>
</template>

<script setup lang="ts">
import type { IconName } from './SfIcon.vue'

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
	.sf-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
}
</style>
