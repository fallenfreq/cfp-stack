<template>
	<div class="layout-card sf-depth-1">
		<slot />
	</div>
</template>

<style scoped>
@layer ui {
	.layout-card {
		container-type: inline-size;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
}
</style>
