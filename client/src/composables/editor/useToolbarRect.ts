import type { Editor } from '@tiptap/vue-3'
import { onMounted, onUnmounted, ref, type Ref } from 'vue'

// Reactive bounding rect of the FloatingToolbar's root element.
//
// Updates on editor transactions, window scroll, window resize, and — crucially
// — a MutationObserver on the toolbar's `style` attribute.  The observer catches
// FloatingToolbar.updatePosition's two-pass measurement settle: pass 1 runs
// synchronously (sets top/left to nodeRect), pass 2 runs after `await nextTick`
// and may shift `left` to fit narrow viewports.  Transaction listeners alone
// fire between the two passes and read the stale rect — without the observer
// consumers stay parked at pass-1 coordinates until the next scroll.
//
// `null` when the toolbar isn't mounted (e.g. when no toolbar items are visible).
export function useToolbarRect(editor: Editor): Ref<DOMRect | null> {
	const rect = ref<DOMRect | null>(null)
	let observer: MutationObserver | null = null
	let observed: HTMLElement | null = null

	const update = () => {
		const el = document.querySelector<HTMLElement>('.floating-toolbar')
		if (!el) {
			rect.value = null
			observer?.disconnect()
			observer = null
			observed = null
			return
		}
		if (observed !== el) {
			observer?.disconnect()
			observed = el
			observer = new MutationObserver(update)
			observer.observe(el, { attributes: true, attributeFilter: ['style'] })
		}
		rect.value = el.getBoundingClientRect()
	}

	onMounted(() => {
		editor.on('transaction', update)
		window.addEventListener('scroll', update, { capture: true, passive: true })
		window.addEventListener('resize', update, { passive: true })
		update()
	})

	onUnmounted(() => {
		editor.off('transaction', update)
		window.removeEventListener('scroll', update, { capture: true })
		window.removeEventListener('resize', update)
		observer?.disconnect()
		observer = null
		observed = null
	})

	return rect
}
