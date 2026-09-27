<template>
	<SfTooltip :text="tooltip">
		<button
			class="material-icon-btn sf sf-on-disabled"
			:class="[`sf-size-${size}`, { 'sf-on-current': active, 'sf-on-hover': !disabled }]"
			:disabled="disabled"
			v-bind="$attrs"
		>
			<MaterialIcon><slot /></MaterialIcon>
		</button>
	</SfTooltip>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })
withDefaults(
	defineProps<{
		tooltip: string
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
		active?: boolean
		disabled?: boolean
	}>(),
	{ size: 'xs' },
)
</script>

<style>
@layer ui {
	.material-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
}
</style>
