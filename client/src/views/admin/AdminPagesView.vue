<template>
	<SfPageShell title="Pages">
		<template #actions>
			<SfIconButton icon="plus" tooltip="New page" @click="onNewPage" />
		</template>

		<input
			v-model="search"
			type="search"
			class="sf sf-field sf-on-focus"
			placeholder="Search by name or slug…"
			aria-label="Search pages"
		/>

		<AdminList :loading="isPending" :empty="!filteredPages.length">
			<template #header>
				<th>Name</th>
				<th>Slug</th>
				<th>Tags</th>
				<th>Published</th>
				<th class="sl-pin-right sf-boundary-left" />
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
					<SfPopover class="sf-size-xs">
						<template #trigger="trigger">
							<SfButton
								v-bind="trigger"
								class="tags-cell sl-cluster sf-gap-2xs sf-is-contained"
								size="2xs"
								:aria-label="tagsLabel(page)"
							>
								<span
									v-if="!pageTags.get(page.pageId)?.length"
									class="sf-text-xs sf-loudness-1"
									>—</span
								>
								<template v-else>
									<span
										v-for="t in (pageTags.get(page.pageId) ?? []).slice(0, 2)"
										:key="t.tagId"
										class="sf-tag sf-single-line sf-size-2xs sf-loudness-2 sf-variant-primary"
										>{{ t.name }}</span
									>
									<span
										v-if="(pageTags.get(page.pageId)?.length ?? 0) > 2"
										class="sf-counter sf-single-line sf-size-2xs sf-loudness-1"
										>+{{ (pageTags.get(page.pageId)?.length ?? 0) - 2 }}</span
									>
								</template>
							</SfButton>
						</template>
						<div class="sl-stack sf-gap-xs">
							<span
								:id="`tags-label-${page.pageId}`"
								class="sf-text-sm sf-loudness-1"
							>
								Tags
							</span>
							<div
								v-if="allTags?.length"
								role="group"
								:aria-labelledby="`tags-label-${page.pageId}`"
								class="sl-stack sf-gap-2xs"
								@change="onTagsChange(page.pageId, $event)"
							>
								<label
									v-for="t in allTags"
									:key="t.tagId"
									class="sl-cluster sf-gap-xs"
								>
									<input
										type="checkbox"
										class="sf"
										:value="t.tagId"
										:checked="
											pageTags
												.get(page.pageId)
												?.some((a) => a.tagId === t.tagId)
										"
									/>
									{{ t.name }}
								</label>
							</div>
							<p v-else class="sf-text-sm">No tags yet.</p>
						</div>
					</SfPopover>
				</template>
				<template #actions>
					<li>
						<RouterLink
							class="sf sf-is-contained sf-size-xs sf-text-sm sf-single-line sf-on-hover"
							:to="{ name: 'editor-page', params: { slug: page.slug } }"
						>
							Edit
						</RouterLink>
					</li>
					<li>
						<RouterLink
							class="sf sf-is-contained sf-size-xs sf-text-sm sf-single-line sf-on-hover"
							:to="{ name: 'page-preview', params: { slug: page.slug } }"
						>
							Preview
						</RouterLink>
					</li>
					<li>
						<SfButton
							class="sf-is-contained sf-text-sm sf-single-line"
							size="xs"
							@click="crud.onRename(page.pageId, page.name || page.slug)"
						>
							Rename
						</SfButton>
					</li>
					<li>
						<SfButton
							class="sf-is-contained sf-text-sm sf-single-line"
							size="xs"
							@click="crud.onChangeSlug(page.pageId, page.slug)"
						>
							Change slug
						</SfButton>
					</li>
					<li>
						<SfButton
							class="sf-is-contained sf-text-sm sf-single-line"
							size="xs"
							variant="danger"
							@click="crud.onDelete(page.pageId, page.name || page.slug)"
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

// The name says which tags the page has, since the tags alone aren't read out.
const tagsLabel = (page: { pageId: number; name: string; slug: string }) => {
	const names = (pageTags.value.get(page.pageId) ?? []).map((t) => t.name).join(', ')
	return `Tags for ${page.name || page.slug}: ${names || 'none'}`
}

// Each save sends the boxes as ticked right now, not the last list from the server,
// so quick ticks don't undo each other. Saves for one page run one after another; a
// failed save reloads, so the boxes show what was actually saved.
const tagSaves = new Map<number, Promise<unknown>>()
const onTagsChange = (pageId: number, event: Event) => {
	const group = event.currentTarget as HTMLElement
	const tagIds = [...group.querySelectorAll<HTMLInputElement>('input:checked')].map((input) =>
		Number(input.value),
	)
	const save = (tagSaves.get(pageId) ?? Promise.resolve()).then(() =>
		trpc.adminPages.update.mutate({ pageId, tagIds }),
	)
	// Reload only once no newer save is waiting — a reload in between would put back
	// ticks the user has since changed.
	const tail: Promise<unknown> = save
		.then(
			async () => {
				if (tagSaves.get(pageId) === tail) await crud.invalidate()
			},
			() => crud.invalidate(),
		)
		// A failed reload mustn't block the next save in the chain.
		.catch(() => undefined)
	tagSaves.set(pageId, tail)
}

const onNewPage = async () => {
	const name = await showPrompt('Page name')
	if (!name) return
	const result = await trpc.adminPages.create.mutate({
		name,
		contentJson: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
	})
	if (result?.slug) {
		router.push({ name: 'editor-page', params: { slug: result.slug } })
	}
}
</script>

<style scoped>
@layer ui {
	/* Arrangement comes from sl-cluster, chrome from SfButton;
	   the min width keeps an empty cell easy to tap. */
	.tags-cell {
		min-width: 48px;
		/* Tags start at the left, in line with the column heading. */
		justify-content: start;
	}
}
</style>
