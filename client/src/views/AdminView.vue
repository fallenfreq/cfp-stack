<template>
	<SfPageShell title="Admin">
		<p class="sf-loudness-1">You have the "admin" role in this project.</p>
		<div class="sl-cluster sf-gap-sm">
			<RouterLink
				class="sf sf-loudness-3 sf-variant-primary sf-on-hover"
				:to="{ name: 'admin-pages' }"
			>
				Manage pages
			</RouterLink>
			<RouterLink
				class="sf sf-loudness-3 sf-variant-primary sf-on-hover"
				:to="{ name: 'admin-collections' }"
			>
				Manage tags
			</RouterLink>
		</div>
	</SfPageShell>
</template>
