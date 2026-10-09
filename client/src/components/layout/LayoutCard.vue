<template>
	<div class="layout-card sf-depth-1">
		<slot />
	</div>
</template>

<style scoped>
@layer ui {
	.layout-card {
		/* Clip without becoming a scroll area, so a block pinned inside sticks to the scroll area
		   around the card; flow-root keeps its blocks' margins inside, as hidden did. */
		display: flow-root;
		overflow: clip;
	}
}
</style>
