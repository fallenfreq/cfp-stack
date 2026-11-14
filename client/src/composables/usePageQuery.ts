import { useIsAdmin } from '@/composables/useIsAdmin'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref, type Ref } from 'vue'

/**
 * A read of a page, or pages, `key` naming which: an admin's copy (admins also get unpublished
 * pages) or the public's. Sign-in lands with the public copy (they're asked together), so the
 * public copy shows until the admin's arrives; another page's never does, nor an admin's once
 * signed out.
 */
export const usePageQuery = <T>(
	key: () => (string | null)[],
	read: (admin: boolean) => Promise<T>,
	{ enabled = ref(true) }: { enabled?: Ref<boolean> } = {},
) => {
	const isAdmin = useIsAdmin()
	// Each copy is read only while it's the one wanted, but keeps up with what's stored: the public
	// copy can be stored just after sign-in lands.
	const copy = (admin: boolean) =>
		useQuery({
			queryKey: computed(() => [...key(), admin]),
			queryFn: () => read(admin),
			enabled: computed(() => enabled.value && isAdmin.value === admin),
		})
	const publicCopy = copy(false)
	const adminCopy = copy(true)
	const wanted = computed(() => (isAdmin.value ? adminCopy : publicCopy))

	// A public copy that found nothing doesn't stand in: not published isn't not there. One that
	// did stays if the admin's read fails.
	const data = computed(() => {
		const standIn = publicCopy.data.value
		return isAdmin.value && adminCopy.data.value === undefined && standIn !== null
			? standIn
			: wanted.value.data.value
	})
	// As TanStack's own isLoadingError, for the copy shown: a read that failed with nothing to show.
	// A copy shown stays when a read again fails.
	return {
		data,
		isPending: computed(() => data.value === undefined && wanted.value.isPending.value),
		isLoadingError: computed(() => data.value === undefined && wanted.value.isError.value),
	}
}
