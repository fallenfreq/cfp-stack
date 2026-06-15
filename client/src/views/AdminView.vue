<template>
	<div class="mx-5 pt-5">
		<h1 class="text-4xl mb-2">Admin</h1>
		<p class="opacity-50 mb-6">You have the "admin" role in this project.</p>
		<div class="flex flex-col gap-3 max-w-sm">
			<VaButton :to="{ name: 'admin-pages' }" block> Manage pages </VaButton>
			<VaButton :to="{ name: 'admin-collections' }" block> Manage tags </VaButton>
		</div>
	</div>
</template>
