<template>
	<VaDropdown placement="bottom-end" :close-on-content-click="true">
		<template #anchor>
			<SfIconButton
				icon="three-dot"
				:size="size"
				:tooltip="tooltip"
				class="sf-is-contained sf-loudness-1"
			/>
		</template>
		<VaDropdownContent>
			<div class="sf-overflow-menu" :class="`sf-size-${size}`">
				<slot />
			</div>
		</VaDropdownContent>
	</VaDropdown>
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
.sf-overflow-menu {
	display: flex;
	flex-direction: column;
	padding: var(--sf-padding);
	min-width: 130px;
}

/* Menu-item layout contract — items fill the menu width and left-align their text.
   Anchor colour/underline UA strips are handled by Tailwind preflight.
   Visual chrome (padding, radius, font, hover, contained) comes from sf classes
   on the item element. */
.sf-overflow-menu > * {
	display: block;
	text-align: left;
	white-space: nowrap;
}
</style>
