<template>
	<SfPageShell title="Pages">
		<template #actions>
			<SfIconButton icon="plus" tooltip="New page" @click="onNewPage" />
		</template>

		<VaInput
			v-model="search"
			placeholder="Search by name or slug…"
			class="mb-4 w-full"
			clearable
		/>

		<AdminList :loading="isPending" :empty="!filteredPages.length">
			<template #header>
				<th>Name</th>
				<th>Slug</th>
				<th>Tags</th>
				<th>Published</th>
				<th />
			</template>
			<template #empty>No pages found.</template>
			<AdminListItem
				v-for="page in filteredPages"
				:key="page.pageId"
				:name="page.name"
				:slug="page.slug"
				:published="page.published"
				@update:published="(v) => togglePublished(page.pageId, v)"
			>
				<template #meta>
					<VaDropdown placement="bottom-start" :close-on-content-click="false">
						<template #anchor>
							<button class="tags-cell">
								<span
									v-if="!pageTags.get(page.pageId)?.length"
									class="tags-cell__empty"
									>—</span>
								<template v-else>
									<span
										v-for="t in (pageTags.get(page.pageId) ?? []).slice(0, 2)"
										:key="t.tagId"
										class="tags-cell__chip"
										>{{ t.name }}</span>
									<span
										v-if="(pageTags.get(page.pageId)?.length ?? 0) > 2"
										class="tags-cell__chip tags-cell__chip--more"
										>+{{ (pageTags.get(page.pageId)?.length ?? 0) - 2 }}</span>
								</template>
							</button>
						</template>
						<VaDropdownContent>
							<div class="tags-cell__popover">
								<VaSelect
									:model-value="
										pageTags.get(page.pageId)?.map((t) => t.tagId) ?? []
									"
									:options="tagOptions"
									value-by="value"
									text-by="text"
									track-by="value"
									multiple
									placeholder="No tags"
									@update:model-value="
										(ids: number[]) => onTagsChange(page.pageId, ids)
									"
								/>
							</div>
						</VaDropdownContent>
					</VaDropdown>
				</template>
				<template #actions>
					<RouterLink
						class="admin-action"
						:to="{ name: 'editor', params: { slug: page.slug } }"
					>
						Edit
					</RouterLink>
					<RouterLink
						class="admin-action"
						:to="{ name: 'page-preview', params: { slug: page.slug } }"
					>
						Preview
					</RouterLink>
					<button
						class="admin-action"
						@click="crud.onRename(page.pageId, page.name || page.slug)"
					>
						Rename
					</button>
					<button class="admin-action" @click="crud.onChangeSlug(page.pageId, page.slug)">
						Change slug
					</button>
					<button
						class="admin-action admin-action--danger"
						@click="crud.onDelete(page.pageId, page.name || page.slug)"
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
import { useAllPages } from '@/services/pages'
import { showPrompt } from '@/services/promptModal'
import { useAllTags } from '@/services/tags'
import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const { data: pages, isPending } = useAllPages()
const { data: allTags } = useAllTags()
const { data: tagAssignments } = useQuery({
	queryKey: ['pages', 'tag-assignments'],
	queryFn: () => trpc.adminPages.listTagAssignments.query(),
})
const search = ref('')

const filteredPages = computed(() => {
	const q = search.value.toLowerCase()
	return (pages.value ?? []).filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q))
})

const tagOptions = computed(() =>
	(allTags.value ?? []).map((t) => ({ value: t.tagId, text: t.name })),
)

const pageTags = computed(() => {
	const map = new Map<number, { tagId: number; name: string }[]>()
	for (const a of tagAssignments.value ?? []) {
		const existing = map.get(a.pageId) ?? []
		existing.push({ tagId: a.tagId, name: a.name })
		map.set(a.pageId, existing)
	}
	return map
})

const crud = useListItemActions({
	queryKey: ['pages'],
	rename: (id, name) => trpc.adminPages.update.mutate({ pageId: id, name }),
	changeSlug: (id, slug) => trpc.adminPages.update.mutate({ pageId: id, slug }),
	delete: (id) => trpc.adminPages.delete.mutate({ pageId: id }),
	deleteMessage: (_id, name) => `Delete "${name}"? This cannot be undone.`,
})

const togglePublished = async (pageId: number, published: boolean) => {
	await trpc.adminPages.update.mutate({ pageId, published })
	await crud.invalidate()
}

const onTagsChange = async (pageId: number, tagIds: number[]) => {
	await trpc.adminPages.update.mutate({ pageId, tagIds })
	await crud.invalidate()
}

const onNewPage = async () => {
	const name = await showPrompt('Page name')
	if (!name) return
	const result = await trpc.adminPages.create.mutate({
		name,
		contentJson: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
	})
	if (result?.slug) {
		router.push({ name: 'editor', params: { slug: result.slug } })
	}
}
</script>

<style scoped>
.tags-cell {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
	background: none;
	border: 1px solid transparent;
	border-radius: 4px;
	padding: 3px 6px;
	cursor: pointer;
	text-align: left;
	transition:
		border-color 0.1s,
		background 0.1s;
	min-width: 48px;
}
.tags-cell:hover {
	background: rgba(var(--text_primary) / 0.05);
	border-color: rgba(var(--text_primary) / 0.15);
}

.tags-cell__empty {
	font-size: 0.75rem;
	opacity: 0.35;
}

.tags-cell__chip {
	font-size: 0.7rem;
	padding: 1px 7px;
	border-radius: 10px;
	background: rgba(var(--primary) / 0.12);
	color: rgb(var(--primary));
	white-space: nowrap;
}
.tags-cell__chip--more {
	background: rgba(var(--text_primary) / 0.08);
	color: rgba(var(--text_primary) / 0.55);
}

.tags-cell__popover {
	padding: 10px;
	min-width: 220px;
}
</style>
