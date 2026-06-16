<template>
	<VaDropdown placement="bottom-end" :close-on-content-click="true">
		<template #anchor>
			<SfIconButton icon="three-dot" variant="ghost" :size="size" :tooltip="tooltip" />
		</template>
		<VaDropdownContent>
			<div class="sf-overflow-menu">
				<slot />
			</div>
		</VaDropdownContent>
	</VaDropdown>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tooltip?: string; size?: 'sm' | 'md' }>(), {
	tooltip: 'More actions',
	size: 'md',
})
</script>

<style>
.sf-overflow-menu {
	display: flex;
	flex-direction: column;
	padding: 4px;
	min-width: 130px;
}
</style>
