import { usePageQuery } from '@/composables/usePageQuery'
import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'

const usePublicPages = () =>
	useQuery({
		queryKey: ['pages', 'public'],
		queryFn: () => trpc.publicPages.list.query(),
	})

const useAllPages = () =>
	useQuery({
		queryKey: ['pages', 'all'],
		queryFn: () => trpc.adminPages.list.query(),
	})

// The pages in a collection; admins also get unpublished ones. Both follow as they change: the
// address (one collection to the next) and sign-in, which can land after the page is up.
const usePagesByCollection = (collectionSlug: MaybeRefOrGetter<string>) =>
	usePageQuery(
		() => ['pages', 'collection', toValue(collectionSlug)],
		(admin) => {
			const input = { collectionSlug: toValue(collectionSlug) }
			return admin
				? trpc.adminPages.listByCollection.query(input)
				: trpc.publicPages.listByCollection.query(input)
		},
	)

export { useAllPages, usePagesByCollection, usePublicPages }
