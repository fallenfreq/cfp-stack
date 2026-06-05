<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
	<header class="m-3">
		<vuesticNavBar />
	</header>

	<main class="flex-1 justify-center">
		<RouterView />
	</main>

	<BasicFooter />
</template>

<style scoped></style>
