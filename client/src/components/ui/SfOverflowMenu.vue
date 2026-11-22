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
		<SfMenu>
			<slot />
		</SfMenu>
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
