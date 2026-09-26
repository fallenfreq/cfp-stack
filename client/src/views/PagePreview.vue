<template>
	<SfStatusDisplay v-if="notFound" state="error" message="Page not found." />
	<SfStatusDisplay v-else-if="!page" state="loading" />
	<template v-else>
		<div v-if="isAdmin" class="preview-edit-bar">
			<VaButton
				preset="secondary"
				size="small"
				:to="{ name: 'editor', params: { slug: route.params.slug } }"
			>
				Edit
			</VaButton>
		</div>
		<PageContent :page="page" />
	</template>
</template>

<script setup lang="ts">
import { useIsAdmin } from '@/composables/useIsAdmin'
import { usePage } from '@/composables/usePage'
import { paramString } from '@/utils/router'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAdmin = useIsAdmin()
const { page, notFound } = usePage(() => paramString(route.params.slug))
</script>

<style scoped>
.preview-edit-bar {
	position: fixed;
	bottom: 1.5rem;
	right: 1.5rem;
	z-index: 50;
}
</style>
