<template>
	<SfPopover :class="`sf-size-${size}`" align="end" close-on-click>
		<template #trigger="trigger">
			<SfIconButton
				v-bind="trigger"
				icon="three-dot"
				:size="size"
				:tooltip="tooltip"
				class="sf-is-contained sf-loudness-1"
			/>
		</template>
		<div class="overflow-menu">
			<slot />
		</div>
	</SfPopover>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		tooltip?: string
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	}>(),
	{ tooltip: 'More actions', size: 'xs' },
)
</script>

<style>
@layer ui {
	/* Menu-item layout contract — items stack (a column makes links and buttons alike
	   fill the width) and left-align their text. Visual chrome (padding, radius, font,
	   hover, contained) comes from sf classes on the item element. */
	.overflow-menu {
		display: flex;
		flex-direction: column;
		min-width: 130px;
	}

	.overflow-menu > * {
		text-align: left;
		white-space: nowrap;
	}
}
</style>
