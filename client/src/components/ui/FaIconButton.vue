<template>
	<SfTooltip :text="tooltip">
		<button
			class="fa-icon-btn sf sf-on-disabled"
			:class="[`sf-size-${size}`, { 'sf-on-hover': !isDisabled() }]"
			v-bind="$attrs"
		>
			<FaIcon :name="icon" />
		</button>
	</SfTooltip>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
import type { IconName } from './FaIcon.vue'

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
	.fa-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
}
</style>
