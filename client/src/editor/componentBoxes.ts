// Each component block's box answers which classes its component drew on it (`sl-stack` on a
// Stack's), which the page doesn't save: the box puts them together with the page builder's and
// the editor's, so it alone can tell them apart (customComponentNode.ts).
import type { EditorView } from '@tiptap/pm/view'

const answers = new WeakMap<object, () => readonly string[]>()

/** A component block's box gives its answer once it's drawn, worked out each time it's asked. */
export const answerForBox = (box: object, answer: () => readonly string[]) => {
	answers.set(box, answer)
}

/**
 * The classes the component at each position of the page the view shows has drawn on its box;
 * undefined where there's no component's box, or none drawn yet.
 */
export const componentClassesIn =
	(view: EditorView) =>
	(pos: number): readonly string[] | undefined => {
		const box = view.nodeDOM(pos)
		return box ? answers.get(box)?.() : undefined
	}
