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

		<AdminList
			:loading="isPending"
			:load-failed="isLoadingError"
			:empty="!filteredPages.length"
		>
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
				@update:published="(v) => crud.onPublish(page.pageId, v)"
			>
				<template #meta>
					<span v-if="!tagsLoaded" class="sf-text-xs sf-loudness-1">
						{{ tagsLoadFailed ? "Couldn't be loaded" : 'Loading…' }}
					</span>
					<SfPopover v-else class="sf-size-xs">
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
import { noAnswer } from '@/services/errors'
import { useAllPages } from '@/services/pages'
import { useAllTags } from '@/services/tags'
import { trpc } from '@/trpc'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const { data: pages, isPending, isLoadingError } = useAllPages()
const { data: allTags, isLoadingError: allTagsLoadFailed } = useAllTags()
const { data: tagAssignments, isLoadingError: assignmentsLoadFailed } = useQuery({
	queryKey: ['pages', 'tag-assignments'],
	queryFn: () => trpc.adminPages.listTagAssignments.query(),
})
// A page's tags show, and can be changed, once both lists have loaded: before, a page would read
// as having none.
const tagsLoaded = computed(() => allTags.value !== undefined && tagAssignments.value !== undefined)
const tagsLoadFailed = computed(() => allTagsLoadFailed.value || assignmentsLoadFailed.value)
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
	rename: ({ id, name }) => trpc.adminPages.update.mutate({ pageId: id, name }),
	changeSlug: ({ id, slug }) => trpc.adminPages.update.mutate({ pageId: id, slug }),
	publish: ({ id, published }) => trpc.adminPages.update.mutate({ pageId: id, published }),
	delete: (id) => trpc.adminPages.delete.mutate({ pageId: id }),
	deleteMessage: (_id, name) => `Delete "${name}"? This cannot be undone.`,
})

// The name says which tags the page has, since the tags alone aren't read out.
const tagsLabel = (page: { pageId: number; name: string; slug: string }) => {
	const names = (pageTags.value.get(page.pageId) ?? []).map((t) => t.name).join(', ')
	return `Tags for ${page.name || page.slug}: ${names || 'none'}`
}

// Each tick saves only its own box, so it can't change the page's other tags (docs/database.md,
// "A write sends only what changed"). Saves for one page run one after another, in the order
// ticked. A failed save says why, and its box goes back to what the server has: what the box's
// last save left, or else what was loaded. Unless the box was ticked again meanwhile: that save
// decides it.
const setTag = useMutation({
	mutationFn: (input: { pageId: number; tagId: number; tagged: boolean }) =>
		trpc.adminPages.setTag.mutate(input),
})
const tagSaves = new Map<number, Promise<unknown>>()
const lastTicks = new Map<string, object>()
const savedTicks = new Map<string, boolean>()
const onTagsChange = (pageId: number, event: Event) => {
	const box = event.target as HTMLInputElement
	const tick = { pageId, tagId: Number(box.value), tagged: box.checked }
	const boxKey = `${pageId}:${tick.tagId}`
	const thisTick = {}
	lastTicks.set(boxKey, thisTick)
	const save = (tagSaves.get(pageId) ?? Promise.resolve()).then(() => setTag.mutateAsync(tick))
	// Reload only once no newer save is waiting — a reload in between would put back
	// ticks the user has since changed.
	const tail: Promise<unknown> = save
		.then(
			async () => {
				savedTicks.set(boxKey, tick.tagged)
				if (tagSaves.get(pageId) === tail) await crud.invalidate()
			},
			async (error: unknown) => {
				// At once: Vue won't, as its data hasn't changed.
				if (lastTicks.get(boxKey) === thisTick) {
					const loaded = pageTags.value.get(pageId)?.some((a) => a.tagId === tick.tagId)
					box.checked = savedTicks.get(boxKey) ?? loaded ?? false
				}
				// Then the list reloads, to show what the server has, if it answered: with no
				// answer, a reload would get none either.
				if (!noAnswer(error)) await crud.invalidate()
			},
		)
		// A failed reload mustn't block the next save in the chain.
		.catch(() => undefined)
	tagSaves.set(pageId, tail)
}

// A new page opens in the editor, and is made at its first Save, which asks its name.
const onNewPage = () => router.push({ name: 'editor' })
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
