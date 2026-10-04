<template>
	<SfStatusDisplay v-if="notFound" state="error" message="Page not found." />
	<SfStatusDisplay v-else-if="!page" state="loading" />
	<template v-else>
		<RouterLink
			v-if="isAdmin"
			class="preview-edit sf sf-depth-2 sf-is-overlay sf-size-xs sf-on-hover"
			:to="{ name: 'editor-page', params: { slug: route.params.slug } }"
		>
			Edit
		</RouterLink>
		<SfPageShell>
			<PageContent :page="page" />
		</SfPageShell>
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
@layer ui {
	/* Floats over the page on the page's own margin. */
	.preview-edit {
		position: fixed;
		bottom: var(--sf-spacing_page);
		right: var(--sf-spacing_page);
		z-index: var(--z-toolbar);
	}
}
</style>
