import { readThemeColor } from '@/utils/editor/colorPalette'
import { Mark, mergeAttributes } from '@tiptap/vue-3'

// Text's colour: a theme colour as its names (colorPalette.ts, `ThemeColor`), written as its
// classes; or a colour not from the theme (a paste, the code view), kept apart, as the browser
// reads it (`#ff0000` as `rgb(255, 0, 0)`). Both can be on one piece of text: the fixed one
// shows, and prefer-theme-color points it out.
const themeColorOf = (el: HTMLElement) =>
	readThemeColor(el.className, 'sf-color-', 'sf-color-alpha-')

const TextColor = Mark.create({
	name: 'textColor',

	addAttributes() {
		return {
			color: {
				default: null as string | null,
				parseHTML: (el) => themeColorOf(el)?.color ?? null,
				renderHTML: (attrs) =>
					attrs['color'] ? { class: `sf-color-${attrs['color']}` } : {},
			},
			alpha: {
				default: null as string | null,
				parseHTML: (el) => themeColorOf(el)?.alpha ?? null,
				renderHTML: (attrs) =>
					attrs['color'] && attrs['alpha']
						? { class: `sf-color-alpha-${attrs['alpha']}` }
						: {},
			},
			fixed: {
				default: null as string | null,
				parseHTML: (el) => el.style.color || null,
				renderHTML: (attrs) =>
					attrs['fixed'] ? { style: `color: ${attrs['fixed']}` } : {},
			},
		}
	},

	parseHTML() {
		return [
			{
				tag: 'span',
				getAttrs: (el) => (themeColorOf(el) || el.style.color ? {} : false),
			},
		]
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', mergeAttributes(HTMLAttributes), 0]
	},
})

export default TextColor
