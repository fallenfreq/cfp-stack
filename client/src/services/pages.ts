import { useIsAdmin } from '@/composables/useIsAdmin'
import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

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
const usePagesByCollection = (collectionSlug: MaybeRefOrGetter<string>) => {
	const isAdmin = useIsAdmin()
	return useQuery({
		queryKey: computed(() => ['pages', 'collection', toValue(collectionSlug), isAdmin.value]),
		queryFn: () => {
			const input = { collectionSlug: toValue(collectionSlug) }
			return isAdmin.value
				? trpc.adminPages.listByCollection.query(input)
				: trpc.publicPages.listByCollection.query(input)
		},
		// When sign-in swaps the list, the one shown stays until the other arrives; another
		// collection's list never does.
		placeholderData: (previous, previousQuery) =>
			previousQuery?.queryKey[2] === toValue(collectionSlug) ? previous : undefined,
	})
}

export { useAllPages, usePagesByCollection, usePublicPages }
