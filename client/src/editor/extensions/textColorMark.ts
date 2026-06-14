import { cssVarColor } from '@/utils/cssVarColor'
import { ALPHA_STEPS, snapToStep } from '@/utils/editor/alphaPalette'
import { parseStoredValue } from '@/utils/editor/colorPalette'
import { Mark, mergeAttributes } from '@tiptap/vue-3'

// Extract sf-color-{token} (not sf-color-alpha-*) from a class list.
const readColorToken = (classList: string): string | null => {
	for (const c of classList.split(/\s+/)) {
		if (c.startsWith('sf-color-') && !c.startsWith('sf-color-alpha-')) {
			return c.slice('sf-color-'.length)
		}
	}
	return null
}

// Reconstruct the stored colour value from sf-color-* classes.
const classesToColor = (classList: string): string | null => {
	const token = readColorToken(classList)
	if (!token) return null
	const cssVar = `--${token}`
	const alphaClass = classList.split(/\s+/).find((c) => c.startsWith('sf-color-alpha-'))
	const alphaName = alphaClass?.slice('sf-color-alpha-'.length) ?? null
	const alphaStep = alphaName
		? ALPHA_STEPS.find((s) => s.cssVar === `--alpha-${alphaName}`)
		: null
	return cssVarColor(cssVar, alphaStep?.value ?? 1)
}

const TextColor = Mark.create({
	name: 'textColor',

	addAttributes() {
		return {
			color: {
				default: null as string | null,
				parseHTML: (el) => {
					const fromClass = classesToColor(el.className)
					return fromClass ?? ((el as HTMLElement).style.color || null)
				},
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
					const fromClass = classesToColor(e.className)
					if (fromClass) return { color: fromClass }
					const inlineColor = e.style.color
					return inlineColor ? { color: inlineColor } : false
				},
			},
		]
	},

	renderHTML({ mark }) {
		const parsed = parseStoredValue(mark.attrs.color)
		if (parsed?.kind === 'token') {
			const colorClass = `sf-color-${parsed.cssVar.slice(2)}`
			const classes = [colorClass]
			if (parsed.alpha < 1) {
				const step = snapToStep(parsed.alpha)
				classes.push(`sf-color-alpha-${step.cssVar.slice('--alpha-'.length)}`)
			}
			return ['span', mergeAttributes({ class: classes.join(' ') }), 0]
		}
		// Arbitrary colour: inline style
		return [
			'span',
			mergeAttributes(mark.attrs.color ? { style: `color: ${mark.attrs.color}` } : {}),
			0,
		]
	},
})

export default TextColor
