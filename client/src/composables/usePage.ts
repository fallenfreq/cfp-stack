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
		{ enabled: computed(() => !!toValue(slug)) },
	)

	// Not found is the server's answer; a read that failed is the toast's to explain
	// (services/errors.ts), and the caller's to name.
	return {
		page: computed(() => query.data.value ?? null),
		notFound: computed(() => query.data.value === null),
		loadFailed: query.isLoadingError,
	}
}
