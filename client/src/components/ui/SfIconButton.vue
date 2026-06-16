<template>
	<SfTooltip :text="tooltip">
		<button
			class="sf-icon-btn"
			:class="[`sf-icon-btn--${variant}`, `sf-icon-btn--${size}`]"
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
		variant?: 'outlined' | 'ghost'
		size?: 'sm' | 'md'
	}>(),
	{ variant: 'outlined', size: 'md' },
)
</script>

<style>
.sf-icon-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: 1px solid transparent;
	cursor: pointer;
	flex-shrink: 0;
	transition:
		color 0.1s,
		background 0.1s,
		border-color 0.1s;
}
.sf-icon-btn:disabled {
	opacity: 0.35;
	cursor: default;
}

/* Sizes */
.sf-icon-btn--md {
	width: 30px;
	height: 30px;
	border-radius: 4px;
}
.sf-icon-btn--sm {
	width: 24px;
	height: 24px;
	border-radius: 3px;
}

/* Variants */
.sf-icon-btn--outlined {
	border-color: rgba(var(--text_primary) / 0.2);
	color: rgba(var(--text_primary) / 0.7);
}
.sf-icon-btn--outlined:hover:not(:disabled) {
	color: rgb(var(--text_primary));
	background: rgba(var(--text_primary) / 0.06);
	border-color: rgba(var(--text_primary) / 0.35);
}

.sf-icon-btn--ghost {
	color: rgba(var(--text_primary) / 0.6);
}
.sf-icon-btn--ghost:hover:not(:disabled) {
	color: rgb(var(--text_primary));
	background: rgba(var(--text_primary) / 0.08);
	border-color: rgba(var(--text_primary) / 0.2);
}
</style>
