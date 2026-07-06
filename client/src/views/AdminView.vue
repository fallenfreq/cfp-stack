<template>
	<SfPageShell title="Admin">
		<p class="opacity-50 mb-6">You have the "admin" role in this project.</p>
		<div class="sl-stack sf-gap-sm max-w-sm">
			<VaButton :to="{ name: 'admin-pages' }" block> Manage pages </VaButton>
			<VaButton :to="{ name: 'admin-collections' }" block> Manage tags </VaButton>
		</div>
	</SfPageShell>
</template>
