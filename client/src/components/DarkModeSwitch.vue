<template>
	<SfSwitch v-model="store.isDarkMode" :disabled="store.isPinkMode" aria-label="Dark mode">
		<template #thumb="{ on }">
			<MaterialIcon>{{ on ? 'dark_mode' : 'light_mode' }}</MaterialIcon>
		</template>
	</SfSwitch>
</template>

<script setup lang="ts">
import { useDarkModeStore } from '@/stores/darkModeStore'
import { AddKeyCombo, RemoveKeyCombo, injectSafe } from '@/symbols'
import { onMounted, onUnmounted } from 'vue'
const store = useDarkModeStore()
const { togglePinkMode } = store

onMounted(() => {
	console.log('Mounting a dark mode switch')
	const addKeyCombo = injectSafe(AddKeyCombo)
	addKeyCombo('Ctrl+Shift+K', togglePinkMode)
})

onUnmounted(() => {
	console.log('Unmounting a dark mode switch')
	const removeKeyCombo = injectSafe(RemoveKeyCombo)
	removeKeyCombo('Ctrl+Shift+K')
})
</script>
