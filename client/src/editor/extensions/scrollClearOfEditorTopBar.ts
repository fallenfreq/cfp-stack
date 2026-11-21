import { Extension } from '@tiptap/vue-3'
import { ref, watch, type WatchStopHandle } from 'vue'

/** The editor's top bar's height (EditorTopBar: the page's row and the node path), as it's drawn. */
export const editorTopBarHeight = ref(0)

/** Where a line is clear of the editor's top bar: its height and a little room. */
export const underEditorTopBar = () => editorTopBarHeight.value + 8

// ProseMirror counts a line under the sticky bar as on the screen, so moving the cursor up could
// leave the line being written hidden there. It scrolls once a line comes within scrollThreshold
// of the top, to scrollMargin from it. Each holds a number per side, so they're given again as the
// bar's height changes. Each side must be given (a missing one turns that side off); the others
// keep ProseMirror's defaults.
// It uses them in a scroll area on the page too, keeping the line that far from its top.
export const ScrollClearOfEditorTopBar = Extension.create<object, { stop: WatchStopHandle | null }>(
	{
		name: 'scrollClearOfEditorTopBar',
		addStorage: () => ({ stop: null }),
		onCreate() {
			this.storage.stop = watch(
				editorTopBarHeight,
				() => {
					const top = underEditorTopBar()
					this.editor.setOptions({
						editorProps: {
							...this.editor.options.editorProps,
							scrollThreshold: { top, right: 0, bottom: 0, left: 0 },
							scrollMargin: { top, right: 5, bottom: 5, left: 5 },
						},
					})
				},
				{ immediate: true },
			)
		},
		onDestroy() {
			this.storage.stop?.()
		},
	},
)
