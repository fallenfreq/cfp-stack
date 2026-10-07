<template>
	<SfPageShell title="Tags">
		<template #actions>
			<SfIconButton icon="plus" tooltip="New tag" @click="onNewTag" />
		</template>
		<p class="sf-text-sm sf-loudness-1">
			Published tags are browseable as collections at <code>/c/:slug</code>. Unpublished tags
			work as internal labels only.
		</p>
		<AdminList :loading="isPending" :empty="!tags?.length">
			<template #header>
				<th>Name</th>
				<th>Slug</th>
				<th>Pages</th>
				<th>Published</th>
				<th class="sl-pin-right sf-boundary-left" />
			</template>
			<template #empty>No tags yet.</template>
			<AdminListItem
				v-for="tag in tags"
				:key="tag.tagId"
				:name="tag.name"
				:slug="tag.slug"
				:published="tag.published"
				@update:published="(v) => crud.onPublish(tag.tagId, v)"
			>
				<template #meta>
					<span class="page-count sf-text-sm sf-loudness-1 sf-single-line">
						{{ tag.pageCount }} page{{ tag.pageCount === 1 ? '' : 's' }}
					</span>
				</template>
				<template #actions>
					<li v-if="tag.published">
						<RouterLink
							class="sf sf-is-contained sf-size-xs sf-text-sm sf-single-line sf-on-hover"
							:to="{ name: 'collection', params: { collectionSlug: tag.slug } }"
						>
							View collection
						</RouterLink>
					</li>
					<li>
						<SfButton
							class="sf-is-contained sf-text-sm sf-single-line"
							size="xs"
							@click="crud.onRename(tag.tagId, tag.name)"
						>
							Rename
						</SfButton>
					</li>
					<li>
						<SfButton
							class="sf-is-contained sf-text-sm sf-single-line"
							size="xs"
							@click="crud.onChangeSlug(tag.tagId, tag.slug)"
						>
							Change slug
						</SfButton>
					</li>
					<li>
						<SfButton
							class="sf-is-contained sf-text-sm sf-single-line"
							size="xs"
							variant="danger"
							@click="crud.onDelete(tag.tagId, tag.name)"
						>
							Delete
						</SfButton>
					</li>
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
import { useMutation } from '@tanstack/vue-query'

const { data: tags, isPending } = useAllTags()

const crud = useListItemActions({
	queryKey: ['tags'],
	rename: ({ id, name }) => trpc.adminTags.update.mutate({ tagId: id, name }),
	changeSlug: ({ id, slug }) => trpc.adminTags.update.mutate({ tagId: id, slug }),
	publish: ({ id, published }) => trpc.adminTags.update.mutate({ tagId: id, published }),
	delete: (id) => trpc.adminTags.delete.mutate({ tagId: id }),
	slugMessage: (current) =>
		`New slug for "${current}"\n⚠ Changing this will break /c/${current} links.`,
	deleteMessage: (id, name) => {
		const tag = tags.value?.find((t) => t.tagId === id)
		return `Delete "${name}"? It is used by ${tag?.pageCount ?? '?'} page(s). Pages will not be deleted, only the tag association.`
	},
})

const createTag = useMutation({
	mutationFn: (name: string) => trpc.adminTags.create.mutate({ name }),
	onSuccess: crud.invalidate,
})

const onNewTag = async () => {
	const name = await showPrompt('Tag name')
	if (name) createTag.mutate(name)
}
</script>

<style scoped>
/* Structural nowrap — everything else comes from the sf classes on the span. */
.page-count {
	white-space: nowrap;
}
</style>
