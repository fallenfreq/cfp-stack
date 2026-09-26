import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Which item is open, kept in the address (?open=<slug>): back closes it, a copied link
// reopens it. It doesn't show anything — the caller decides what "open" looks like.
export const useOpenItem = () => {
	const route = useRoute()
	const router = useRouter()

	const openSlug = computed(() => {
		const value = route.query.open
		return typeof value === 'string' && value ? value : null
	})

	// Closing steps back only when we added the history entry; someone who arrived on
	// a copied link would otherwise leave the site.
	let openedHere = false

	// Going back takes a moment; a second close in that moment would remove `open` again.
	let closing = false
	watch(openSlug, () => {
		closing = false
	})

	const open = (slug: string) => {
		if (openSlug.value === slug) return
		const query = { ...route.query, open: slug }
		// Switching items replaces the entry, so back still means "close".
		if (openSlug.value) {
			router.replace({ query })
			return
		}
		router.push({ query })
		openedHere = true
	}

	const close = () => {
		if (!openSlug.value || closing) return
		closing = true
		if (openedHere) {
			openedHere = false
			router.back()
			return
		}
		const query = { ...route.query }
		delete query.open
		router.replace({ query })
	}

	return { openSlug, open, close }
}
