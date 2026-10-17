import type { RouteLocationNormalized } from 'vue-router'
import {
	SCROLL_RESTORATION_CAPTURE_DEFAULT,
	SCROLL_RESTORATION_RESTORE_DEFAULT,
	type ScrollRestorationPluginOptions,
} from 'vue-router/experimental'

// Each page keeps where it was scrolled while the tab is open, and goes back there when it's shown
// again (Back, Forward, a link, a reload) once it's long enough to reach it: if that's within a
// second and none of its pictures is still loading (Back and Forward find them loaded). Otherwise
// it stays at its top, where a page not seen yet opens (or at its `#`). Scrolling, clicking or
// typing first leaves it to the reader. The editor's place is its cursor instead (RememberCursor).
// vue-router's ScrollRestoration keeps the places (main.ts, App.vue).

// Any later, and the reader would have started on the page before it moved.
const WAIT = 1000

const isEditor = (at: RouteLocationNormalized) => at.name === 'editor' || at.name === 'editor-page'
const picturesLoading = () => [...document.images].some((picture) => !picture.complete)

let shown: string | null = null
let stopWaiting: (() => void) | null = null

const restore: ScrollRestorationPluginOptions['restore'] = (entry, to) => {
	stopWaiting?.()
	const before = shown
	shown = to.path + to.hash
	// The same page with another query (a page opened in a collection's sheet) stays put.
	if (shown === before || isEditor(to)) return
	const place = entry?.default?.top ?? 0
	const hash = entry?.default ? '' : to.hash.slice(1)
	scrollTo(0, 0)
	if (place === 0 && !hash) return
	const reachable = () =>
		hash
			? document.getElementById(hash) !== null
			: document.documentElement.scrollHeight - innerHeight > place - 1
	const look = () => {
		if (!reachable()) return
		stop()
		if (!picturesLoading()) SCROLL_RESTORATION_RESTORE_DEFAULT(entry, to)
	}
	// Each time the page grows, from its first drawing.
	const sizes = new ResizeObserver(look)
	sizes.observe(document.documentElement)
	const reader = new AbortController()
	for (const kind of ['wheel', 'touchstart', 'keydown', 'pointerdown'])
		addEventListener(kind, stop, { capture: true, passive: true, signal: reader.signal })
	const timer = setTimeout(stop, WAIT)
	function stop() {
		sizes.disconnect()
		reader.abort()
		clearTimeout(timer)
		stopWaiting = null
	}
	stopWaiting = stop
}

export const pagePlace = { capture: SCROLL_RESTORATION_CAPTURE_DEFAULT, restore }
