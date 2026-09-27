<template>
	<SfTooltip :text="tooltip">
		<button
			class="sf-icon-btn sf sf-on-disabled"
			:aria-label="tooltip"
			:class="[`sf-size-${size}`, { 'sf-on-hover': !isDisabled() }]"
			v-bind="$attrs"
		>
			<SfIcon :name="icon" />
		</button>
	</SfTooltip>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
import type { IconName } from './SfIcon.vue'

defineOptions({ inheritAttrs: false })
// disabled passes through to the button with the other attributes; read it here so a
// disabled button doesn't respond to hover.
const attrs = useAttrs()
const isDisabled = () => attrs.disabled != null && attrs.disabled !== false
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
