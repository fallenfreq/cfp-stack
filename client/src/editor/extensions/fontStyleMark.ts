import { Mark, mergeAttributes } from '@tiptap/vue-3'

const FontStyle = Mark.create({
	name: 'fontStyle',

	addAttributes() {
		return {
			fontFamily: {
				default: null as string | null,
				parseHTML: (el) => (el as HTMLElement).style.fontFamily || null,
				renderHTML: (attrs) =>
					attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {},
			},
			fontSize: {
				default: null as string | null,
				parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
				renderHTML: (attrs) =>
					attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
			},
			lineHeight: {
				default: null as string | null,
				parseHTML: (el) => (el as HTMLElement).style.lineHeight || null,
				renderHTML: (attrs) =>
					attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
			},
			letterSpacing: {
				default: null as string | null,
				parseHTML: (el) => (el as HTMLElement).style.letterSpacing || null,
				renderHTML: (attrs) =>
					attrs.letterSpacing ? { style: `letter-spacing: ${attrs.letterSpacing}` } : {},
			},
		}
	},

	parseHTML() {
		return [
			{
				tag: 'span',
				getAttrs: (el) => {
					const e = el as HTMLElement
					const fontFamily = e.style.fontFamily || null
					const fontSize = e.style.fontSize || null
					const lineHeight = e.style.lineHeight || null
					const letterSpacing = e.style.letterSpacing || null
					return fontFamily || fontSize || lineHeight || letterSpacing
						? { fontFamily, fontSize, lineHeight, letterSpacing }
						: false
				},
			},
		]
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', mergeAttributes(HTMLAttributes), 0]
	},
})

export default FontStyle
