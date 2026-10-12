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
	options: { enabled?: Ref<boolean>; retry?: false } = {},
) => {
	const isAdmin = useIsAdmin()
	const { enabled = ref(true), ...rest } = options
	// Each copy is read only while it's the one wanted, but keeps up with what's stored: the public
	// copy can be stored just after sign-in lands.
	const copy = (admin: boolean) =>
		useQuery({
			...rest,
			queryKey: computed(() => [...key(), admin]),
			queryFn: () => read(admin),
			enabled: computed(() => enabled.value && isAdmin.value === admin),
		})
	const publicCopy = copy(false)
	const adminCopy = copy(true)
	const wanted = computed(() => (isAdmin.value ? adminCopy : publicCopy))

	// A public copy that found nothing doesn't stand in: not published isn't not there.
	const data = computed(() => {
		const standIn = publicCopy.data.value
		return isAdmin.value && adminCopy.isPending.value && standIn !== null
			? standIn
			: wanted.value.data.value
	})
	return {
		data,
		isPending: computed(() => data.value === undefined && wanted.value.isPending.value),
		isError: computed(() => wanted.value.isError.value),
	}
}
