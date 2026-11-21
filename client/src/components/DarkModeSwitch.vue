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
		<!-- Words given are the switch's label; with none (the site's header) it stays bare. -->
		<template v-if="$slots['default']" #default><slot /></template>
	</SfSwitch>
</template>

<script setup lang="ts">
import { useDarkModeStore } from '@/stores/darkModeStore'
const store = useDarkModeStore()
</script>
