import { getClassToken } from '@/utils/editor/classTokens'
import { parseFontVar } from '@/utils/editor/fontPalette'
import { Mark, mergeAttributes } from '@tiptap/vue-3'

// Convert 'var(--font-sans)' → 'sf-font-sans'; null if not a CSS-var reference.
const varToClass = (value: string | null): string | null => {
	const cssVar = parseFontVar(value)
	return cssVar ? `sf-${cssVar.slice(2)}` : null
}

// 'sf-font-', 'sans' → 'var(--font-sans)'
const tokenToVar = (sfPrefix: string, cssVarPrefix: string, cls: string): string | null => {
	const token = getClassToken(cls, sfPrefix)
	return token ? `var(${cssVarPrefix}${token})` : null
}

const FontStyle = Mark.create({
	name: 'fontStyle',

	addAttributes() {
		return {
			fontFamily: {
				default: null as string | null,
				parseHTML: (el) => tokenToVar('sf-font-', '--font-', el.className),
				renderHTML: () => ({}),
			},
			fontSize: {
				default: null as string | null,
				parseHTML: (el) => tokenToVar('sf-text-', '--text-', el.className),
				renderHTML: () => ({}),
			},
			lineHeight: {
				default: null as string | null,
				parseHTML: (el) => tokenToVar('sf-leading-', '--leading-', el.className),
				renderHTML: () => ({}),
			},
			letterSpacing: {
				default: null as string | null,
				parseHTML: (el) => tokenToVar('sf-tracking-', '--tracking-', el.className),
				renderHTML: () => ({}),
			},
		}
	},

	parseHTML() {
		return [
			{
				tag: 'span',
				getAttrs: (el) => {
					const e = el as HTMLElement
					const fontFamily = tokenToVar('sf-font-', '--font-', e.className)
					const fontSize = tokenToVar('sf-text-', '--text-', e.className)
					const lineHeight = tokenToVar('sf-leading-', '--leading-', e.className)
					const letterSpacing = tokenToVar('sf-tracking-', '--tracking-', e.className)
					return fontFamily || fontSize || lineHeight || letterSpacing
						? { fontFamily, fontSize, lineHeight, letterSpacing }
						: false
				},
			},
		]
	},

	renderHTML({ attrs }) {
		const classes = [
			varToClass(attrs.fontFamily),
			varToClass(attrs.fontSize),
			varToClass(attrs.lineHeight),
			varToClass(attrs.letterSpacing),
		]
			.filter(Boolean)
			.join(' ')
		return ['span', mergeAttributes(classes ? { class: classes } : {}), 0]
	},
})

export default FontStyle
