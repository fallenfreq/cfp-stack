<template>
	<SfSwitch v-model="store.isDarkMode" :disabled="store.isPinkMode" aria-label="Dark mode">
		<template #thumb="{ on }">
			<MaterialIcon>{{ on ? 'dark_mode' : 'light_mode' }}</MaterialIcon>
		</template>
		<template #off>
			<MaterialIcon>light_mode</MaterialIcon>
		</template>
		<template #on>
			<MaterialIcon>dark_mode</MaterialIcon>
		</template>
	</SfSwitch>
</template>

<script setup lang="ts">
import { useDarkModeStore } from '@/stores/darkModeStore'
const store = useDarkModeStore()
</script>
