<template>
	<SfPopover :class="`sf-size-${size}`" align="end" close-on-click>
		<template #trigger="trigger">
			<SfIconButton
				v-bind="trigger"
				icon="three-dot"
				:size="size"
				:tooltip="tooltip"
				class="sf-is-contained"
				:loudness="1"
			/>
		</template>
		<!-- Each action goes in its own <li>. -->
		<menu class="overflow-menu">
			<slot />
		</menu>
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
	/* Menu-item layout contract — items stack and each fills the width, so links and
	   buttons alike line up, with their text on the left. Visual chrome (padding, radius,
	   font, hover, contained) comes from sf classes on the item element. */
	.overflow-menu {
		display: flex;
		flex-direction: column;
		min-width: 130px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.overflow-menu > li > * {
		inline-size: 100%;
		text-align: left;
		white-space: nowrap;
	}
}
</style>
