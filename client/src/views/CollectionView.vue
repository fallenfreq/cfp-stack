<template>
	<div class="mx-5 pt-5">
		<SfStatusDisplay v-if="tagPending" state="loading" />
		<SfStatusDisplay
			v-else-if="!tag || (!tag.published && !isAdmin)"
			state="error"
			message="This collection does not exist."
		/>
		<div v-else>
			<div class="flex justify-between items-center mb-5">
				<div>
					<h1 class="text-4xl">{{ tag.name }}</h1>
					<p v-if="!tag.published" class="text-sm opacity-50 mt-1">
						Not published — only admins can see this collection
					</p>
				</div>
				<div v-if="isAdmin" class="flex gap-2">
					<VaButton
						preset="secondary"
						size="small"
						:to="{ name: 'editor', query: autoTagQuery }"
					>
						New page
					</VaButton>
					<VaButton preset="secondary" size="small" :to="{ name: 'admin-pages' }">
						Manage
					</VaButton>
				</div>
			</div>
			<CollectionGrid
				:items="gridItems"
				:placeholder-title="pagesPending ? 'Loading...' : 'Coming Soon!'"
				@select-item="onSelectItem"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useIsAdmin } from '@/composables/useIsAdmin'
import { usePagesByCollection, usePagesByCollectionAdmin } from '@/services/pages'
import { trpc } from '@/trpc'
import type { GridItem } from '@/utils/collectionPlaceholders'
import { paramString } from '@/utils/router'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
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

const autoTagQuery = computed(() => (tag.value ? { autoTag: tag.value.tagId } : undefined))

const onSelectItem = (item: GridItem) => {
	if (item.slug) {
		router.push({ name: 'page-preview', params: { slug: item.slug as string } })
	}
}
</script>
