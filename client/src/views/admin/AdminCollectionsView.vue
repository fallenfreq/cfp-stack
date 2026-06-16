<template>
	<SfPageShell title="Tags">
		<template #actions>
			<SfIconButton icon="plus" tooltip="New tag" @click="onNewTag" />
		</template>
		<p class="text-sm opacity-50 mb-5">
			Published tags are browseable as collections at <code>/c/:slug</code>. Unpublished tags
			work as internal labels only.
		</p>
		<AdminList :loading="isPending" :empty="!tags?.length">
			<template #header>
				<th>Name</th>
				<th>Slug</th>
				<th>Pages</th>
				<th>Published</th>
				<th />
			</template>
			<template #empty>No tags yet.</template>
			<AdminListItem
				v-for="tag in tags"
				:key="tag.tagId"
				:name="tag.name"
				:slug="tag.slug"
				:published="tag.published"
				@update:published="(v) => togglePublished(tag.tagId, v)"
			>
				<template #meta>
					<span class="page-count">
						{{ tag.pageCount }} page{{ tag.pageCount === 1 ? '' : 's' }}
					</span>
				</template>
				<template #actions>
					<RouterLink
						v-if="tag.published"
						class="admin-action"
						:to="{ name: 'collection', params: { collectionSlug: tag.slug } }"
					>
						View collection
					</RouterLink>
					<button class="admin-action" @click="crud.onRename(tag.tagId, tag.name)">
						Rename
					</button>
					<button class="admin-action" @click="crud.onChangeSlug(tag.tagId, tag.slug)">
						Change slug
					</button>
					<button
						class="admin-action admin-action--danger"
						@click="crud.onDelete(tag.tagId, tag.name)"
					>
						Delete
					</button>
				</template>
			</AdminListItem>
		</AdminList>
	</SfPageShell>
</template>

<script setup lang="ts">
import AdminList from '@/components/admin/AdminList.vue'
import AdminListItem from '@/components/admin/AdminListItem.vue'
import { useListItemActions } from '@/composables/useListItemActions'
import { showPrompt } from '@/services/promptModal'
import { useAllTags } from '@/services/tags'
import { trpc } from '@/trpc'

const { data: tags, isPending } = useAllTags()

const crud = useListItemActions({
	queryKey: ['tags'],
	rename: (id, name) => trpc.adminTags.update.mutate({ tagId: id, name }),
	changeSlug: (id, slug) => trpc.adminTags.update.mutate({ tagId: id, slug }),
	delete: (id) => trpc.adminTags.delete.mutate({ tagId: id }),
	slugMessage: (current) =>
		`New slug for "${current}"\n⚠ Changing this will break /c/${current} links.`,
	deleteMessage: (id, name) => {
		const tag = tags.value?.find((t) => t.tagId === id)
		return `Delete "${name}"? It is used by ${tag?.pageCount ?? '?'} page(s). Pages will not be deleted, only the tag association.`
	},
})

const togglePublished = async (tagId: number, published: boolean) => {
	await trpc.adminTags.update.mutate({ tagId, published })
	await crud.invalidate()
}

const onNewTag = async () => {
	const name = await showPrompt('Tag name')
	if (!name) return
	await trpc.adminTags.create.mutate({ name })
	await crud.invalidate()
}
</script>

<style scoped>
.page-count {
	font-size: 0.8rem;
	color: rgba(var(--text_primary) / 0.55);
	white-space: nowrap;
}
</style>
