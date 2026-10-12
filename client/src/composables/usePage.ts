import { usePageQuery } from '@/composables/usePageQuery'
import { trpc } from '@/trpc'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

// A page's data and info. Loads it, shows nothing — the caller decides what to do with it.
// Admins also get unpublished pages. No slug, no request.
export const usePage = (slug: MaybeRefOrGetter<string | null>) => {
	const query = usePageQuery(
		() => ['page', toValue(slug)],
		(admin) => {
			const input = { slug: toValue(slug) ?? '' }
			return admin
				? trpc.adminPages.getBySlug.query(input)
				: trpc.publicPages.getBySlug.query(input)
		},
		{ enabled: computed(() => !!toValue(slug)), retry: false },
	)

	return {
		page: computed(() => query.data.value ?? null),
		notFound: computed(() => query.isError.value || query.data.value === null),
	}
}
