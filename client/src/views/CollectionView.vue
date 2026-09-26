<template>
	<SfStatusDisplay v-if="tagPending" state="loading" />
	<SfStatusDisplay
		v-else-if="!tag || (!tag.published && !isAdmin)"
		state="error"
		message="This collection does not exist."
	/>
	<SfPageShell v-else :title="tag.name">
		<template v-if="isAdmin" #actions>
			<div class="sl-cluster sf-gap-xs">
				<RouterLink
					class="sf sf-loudness-2 sf-on-hover sf-size-xs"
					:to="{ name: 'editor', query: autoTagQuery }"
				>
					New page
				</RouterLink>
				<RouterLink
					class="sf sf-loudness-2 sf-on-hover sf-size-xs"
					:to="{ name: 'admin-pages' }"
				>
					Manage
				</RouterLink>
			</div>
		</template>
		<p v-if="!tag.published" class="sf-text-sm sf-loudness-1">
			Not published — only admins can see this collection
		</p>
		<CollectionGrid
			:items="gridItems"
			:placeholder-title="pagesPending ? 'Loading...' : 'Coming Soon!'"
		/>
	</SfPageShell>
</template>

<script setup lang="ts">
import { useIsAdmin } from '@/composables/useIsAdmin'
import { usePagesByCollection, usePagesByCollectionAdmin } from '@/services/pages'
import { trpc } from '@/trpc'
import type { GridItem } from '@/utils/collectionPlaceholders'
import { paramString } from '@/utils/router'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const collectionSlug = computed(() => paramString(route.params.collectionSlug))
const isAdmin = useIsAdmin()

const { data: tag, isPending: tagPending } = useQuery({
	queryKey: computed(() => ['tags', 'slug', collectionSlug.value]),
	queryFn: () => trpc.publicTags.getBySlug.query({ slug: collectionSlug.value }),
})

const { data: pages, isPending: pagesPending } = isAdmin.value
	? usePagesByCollectionAdmin(collectionSlug.value)
	: usePagesByCollection(collectionSlug.value)

const gridItems = computed<GridItem[]>(() =>
	(pages.value ?? []).map((p) => ({
		imageUrl: p.imageUrl ?? '',
		title: p.name || p.slug,
		slug: p.slug,
	})),
)

const autoTagQuery = computed(() => (tag.value ? { autoTag: tag.value.tagId } : {}))
</script>
