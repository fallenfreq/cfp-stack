import { getClassToken } from '@/utils/editor/classTokens'
import { parseFontVar } from '@/utils/editor/fontPalette'
import { Mark, mergeAttributes } from '@tiptap/vue-3'

// Convert 'var(--sf-font-1)' → 'sf-font-1'; null if not a CSS-var reference.
const varToClass = (value: string | null): string | null => {
	const cssVar = parseFontVar(value)
	return cssVar ? `sf-${cssVar.slice('--sf-'.length)}` : null
}

// 'sf-font-', '1' → 'var(--sf-font-1)'
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
				parseHTML: (el) => tokenToVar('sf-font-', '--sf-font-', el.className),
				renderHTML: () => ({}),
			},
			fontSize: {
				default: null as string | null,
				parseHTML: (el) => tokenToVar('sf-text-', '--sf-text-', el.className),
				renderHTML: () => ({}),
			},
			lineHeight: {
				default: null as string | null,
				parseHTML: (el) => tokenToVar('sf-leading-', '--sf-leading-', el.className),
				renderHTML: () => ({}),
			},
			letterSpacing: {
				default: null as string | null,
				parseHTML: (el) => tokenToVar('sf-tracking-', '--sf-tracking-', el.className),
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
					const fontFamily = tokenToVar('sf-font-', '--sf-font-', e.className)
					const fontSize = tokenToVar('sf-text-', '--sf-text-', e.className)
					const lineHeight = tokenToVar('sf-leading-', '--sf-leading-', e.className)
					const letterSpacing = tokenToVar('sf-tracking-', '--sf-tracking-', e.className)
					return fontFamily || fontSize || lineHeight || letterSpacing
						? { fontFamily, fontSize, lineHeight, letterSpacing }
						: false
				},
			},
		]
	},

	renderHTML({ mark }) {
		const classes = [
			varToClass(mark.attrs.fontFamily),
			varToClass(mark.attrs.fontSize),
			varToClass(mark.attrs.lineHeight),
			varToClass(mark.attrs.letterSpacing),
		]
			.filter(Boolean)
			.join(' ')
		return ['span', mergeAttributes(classes ? { class: classes } : {}), 0]
	},
})

export default FontStyle
