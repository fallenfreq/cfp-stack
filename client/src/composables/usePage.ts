import { useIsAdmin } from '@/composables/useIsAdmin'
import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

// A page's data and info. Loads it, shows nothing — the caller decides what to do with it.
// Admins also get unpublished pages. No slug, no request.
export const usePage = (slug: MaybeRefOrGetter<string | null>) => {
	const isAdmin = useIsAdmin()
	const query = useQuery({
		queryKey: computed(() => ['page', toValue(slug), isAdmin.value]),
		queryFn: () => {
			const input = { slug: toValue(slug) ?? '' }
			return isAdmin.value
				? trpc.adminPages.getBySlug.query(input)
				: trpc.publicPages.getBySlug.query(input)
		},
		enabled: computed(() => !!toValue(slug)),
		retry: false,
	})

	return {
		page: computed(() => query.data.value ?? null),
		notFound: computed(() => query.isError.value || query.data.value === null),
	}
}
