<template>
	<PageContent v-if="page" :page="page" />
	<div v-else-if="notFound" class="sl-cover" style="--sl-cover-min: 20rem">
		<div class="sl-stack sf-gap-sm">
			<p class="sf-loudness-1">Nothing here yet.</p>
			<RouterLink
				v-if="isAdmin"
				class="sf sf-loudness-2 sf-on-hover sf-size-xs"
				:to="{ name: 'editor' }"
			>
				Create a page named “Home”
			</RouterLink>
		</div>
	</div>
	<SfStatusDisplay v-else state="loading" />
</template>

<script setup lang="ts">
import { useIsAdmin } from '@/composables/useIsAdmin'
import { usePage } from '@/composables/usePage'

// The home page is the page with the slug "home" — edit it in the editor like any other.
const { page, notFound } = usePage('home')
const isAdmin = useIsAdmin()
</script>
