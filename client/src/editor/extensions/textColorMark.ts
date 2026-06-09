import { Mark, mergeAttributes } from '@tiptap/vue-3'

const TextColor = Mark.create({
	name: 'textColor',

	addAttributes() {
		return {
			color: {
				default: null as string | null,
				parseHTML: (el) => (el as HTMLElement).style.color || null,
				renderHTML: (attrs) => (attrs.color ? { style: `color: ${attrs.color}` } : {}),
			},
		}
	},

	parseHTML() {
		return [
			{
				tag: 'span',
				// Only claim spans that carry a color, so we don't fight the inline span node extension.
				getAttrs: (el) => {
					const color = (el as HTMLElement).style.color
					return color ? { color } : false
				},
			},
		]
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', mergeAttributes(HTMLAttributes), 0]
	},
})

export default TextColor
