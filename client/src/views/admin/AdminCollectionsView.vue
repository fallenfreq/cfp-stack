<template>
	<div class="mx-5 pt-5">
		<div class="flex justify-between items-center mb-5">
			<h1 class="text-4xl">Tags</h1>
			<button class="admin-icon-btn" title="New tag" @click="onNewTag">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path
						d="M8 2v12M2 8h12"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>
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
					<button class="admin-action" @click="onRename(tag)">Rename</button>
					<button class="admin-action" @click="onChangeSlug(tag)">Change slug</button>
					<button class="admin-action admin-action--danger" @click="onDelete(tag)">
						Delete
					</button>
				</template>
			</AdminListItem>
		</AdminList>
	</div>
</template>

<script setup lang="ts">
import AdminList from '@/components/admin/AdminList.vue'
import AdminListItem from '@/components/admin/AdminListItem.vue'
import { showPrompt } from '@/services/promptModal'
import { useAllTags } from '@/services/tags'
import { trpc } from '@/trpc'
import { useQueryClient } from '@tanstack/vue-query'
import { useModal } from 'vuestic-ui'

type TagRow = Awaited<ReturnType<typeof trpc.adminTags.list.query>>[number]

const { confirm } = useModal()
const queryClient = useQueryClient()

const { data: tags, isPending } = useAllTags()

const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tags'] })

const togglePublished = async (tagId: number, published: boolean) => {
	await trpc.adminTags.update.mutate({ tagId, published })
	await invalidate()
}

const onNewTag = async () => {
	const name = await showPrompt('Tag name')
	if (!name) return
	await trpc.adminTags.create.mutate({ name })
	await invalidate()
}

const onRename = async (tag: TagRow) => {
	const name = await showPrompt(`New name for "${tag.name}"`)
	if (!name) return
	await trpc.adminTags.update.mutate({ tagId: tag.tagId, name })
	await invalidate()
}

const onChangeSlug = async (tag: TagRow) => {
	const newSlug = await showPrompt(
		`New slug for "${tag.name}"\n⚠ Changing slug will break /c/${tag.slug} links.`,
	)
	if (!newSlug) return
	await trpc.adminTags.update.mutate({ tagId: tag.tagId, slug: newSlug })
	await invalidate()
}

const onDelete = async (tag: TagRow) => {
	const ok = await confirm({
		message: `Delete tag "${tag.name}"? It is used by ${tag.pageCount} page(s). Pages will not be deleted, only the tag association.`,
		okText: 'Delete',
		cancelText: 'Cancel',
	})
	if (!ok) return
	await trpc.adminTags.delete.mutate({ tagId: tag.tagId })
	await invalidate()
}
</script>

<style scoped>
.page-count {
	font-size: 0.8rem;
	color: rgba(var(--text_primary) / 0.55);
	white-space: nowrap;
}
</style>
