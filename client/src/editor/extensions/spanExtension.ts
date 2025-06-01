import { Node } from '@tiptap/vue-3'

const Span = Node.create({
	name: 'span',
	inline: true,
	group: 'inline',
	content: 'inline*',
	draggable: true,
	addAttributes() {
		return {}
	},
	// https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#render-html
	parseHTML() {
		return [
			{
				tag: 'span',
				getAttrs: () => {
					return {}
				}
			}
		]
	},
	renderHTML({ HTMLAttributes }) {
		// The last elements in the array are the children and 0 is the default content
		return ['span', { ...HTMLAttributes }, 0]
	}
})

export default Span
