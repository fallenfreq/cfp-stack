import { Selection, TextSelection } from '@tiptap/pm/state'
import { Extension } from '@tiptap/vue-3'

// The editor opens where its cursor was last time on this page, in this browser, the cursor's
// line just under the editor's top bar. What's above it on the page is then off the screen, so a
// picture there arriving late doesn't push it down: the browser keeps what's on screen in place.
// A page with none kept opens at its top, the cursor at its start. In the editor the cursor is
// the place, not how far the page was scrolled (router/pagePlace.ts leaves the editor to this).
export const RememberCursor = Extension.create<{ key: () => string | null }, { ready: boolean }>({
	name: 'rememberCursor',
	addOptions: () => ({ key: () => null }),
	addStorage: () => ({ ready: false }),
	onCreate() {
		const kept = read(this.options.key())
		scrollTo(0, 0)
		if (kept === null) this.editor.commands.focus('start', { scrollIntoView: false })
		else {
			const { state, view } = this.editor
			// The nearest place a cursor can go: a picture or a rule kept was selected, not typed
			// in, and the page may have changed since.
			const near = Selection.near(state.doc.resolve(Math.min(kept, state.doc.content.size)))
			scrollTo(0, view.coordsAtPos(near.head).top - underTheBar())
			// The cursor goes in with the focus: put in before it, WebKit's focus sometimes moved
			// it to the start of the page (measured).
			if (near instanceof TextSelection)
				this.editor.commands.focus(near.head, { scrollIntoView: false })
			else {
				view.dispatch(state.tr.setSelection(near))
				this.editor.commands.focus(null, { scrollIntoView: false })
			}
		}
		// Only cursors from here on: opening the page moves it too.
		this.storage.ready = true
	},
	onSelectionUpdate() {
		const key = this.options.key()
		if (this.storage.ready && key) write(key, this.editor.state.selection.head)
	},
})

// The editor's top bar's height, which it gives the page (EditorTopBar), and a little room.
const underTheBar = () =>
	(parseFloat(
		getComputedStyle(document.documentElement).getPropertyValue('--editor-top-bar-height'),
	) || 0) + 8

// The browser may refuse its storage (a private window, blocked site data): then nothing is kept.
const read = (key: string | null) => {
	if (!key) return null
	try {
		const kept = Number(localStorage.getItem(`cursor:${key}`))
		return Number.isInteger(kept) && kept > 0 ? kept : null
	} catch {
		return null
	}
}
const write = (key: string, at: number) => {
	try {
		localStorage.setItem(`cursor:${key}`, String(at))
	} catch {
		// Not kept: the page opens at its top next time.
	}
}
