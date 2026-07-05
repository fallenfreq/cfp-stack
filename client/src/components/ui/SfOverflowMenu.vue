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
</style>
