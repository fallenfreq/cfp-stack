import { setStyleProp } from '@/utils/editor/styleString'
import {
	isTextLooks,
	LOOK_SETTINGS,
	lookClass,
	LOOKS,
	looksIn,
	type LookSetting,
} from '@somefreq-app/shared/textLooks'
import { TextStyle } from '@tiptap/extension-text-style'

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		textLooks: {
			/**
			 * Sets these looks (a slot's name, or null for none) on each piece of the text from..to,
			 * keeping its others; the CSS property each sets goes from its style. A piece left with no
			 * looks loses the mark.
			 */
			setTextLooks: (
				from: number,
				to: number,
				looks: Partial<Record<LookSetting, string | null>>,
			) => ReturnType
		}
	}
}

// Text's looks are one mark, each look a setting holding its slot's name, written as its class,
// and `style` the span's style, which holds only looks (`isTextLooks`). A look span inside another
// replaces the outer one's looks for its words, as ProseMirror reads it, and the code view says to
// put the looks on one span (sf-system.md, "Editor integration").
export const isLookSpan = (el: HTMLElement) =>
	el.localName === 'span'
	&& isTextLooks({
		hasId: el.hasAttribute('id'),
		classes: [...el.classList],
		properties: [...Array(el.style.length).keys()].map((i) => el.style.item(i)),
	})

export const TextStyleMark = TextStyle.extend({
	addAttributes() {
		return {
			...Object.fromEntries(
				LOOK_SETTINGS.map((setting) => [
					setting,
					{
						default: null,
						parseHTML: (el: HTMLElement) => looksIn(el.className)[setting] ?? null,
						renderHTML: (attrs: Record<string, unknown>) => {
							const name = attrs[setting]
							return typeof name === 'string' && name
								? { class: lookClass(setting, name) }
								: {}
						},
					},
				]),
			),
			style: {
				default: null,
				parseHTML: (el: HTMLElement) => el.style.cssText || null,
				renderHTML: (attrs: Record<string, unknown>) =>
					attrs['style'] ? { style: String(attrs['style']) } : {},
			},
		}
	},

	parseHTML() {
		return [{ tag: 'span', getAttrs: (el) => (isLookSpan(el) ? {} : false) }]
	},

	addCommands() {
		return {
			...this.parent?.(),
			setTextLooks:
				(from, to, looks) =>
				({ tr }) => {
					const replaced = LOOK_SETTINGS.filter((setting) => setting in looks).flatMap(
						(setting) => LOOKS[setting].property ?? [],
					)
					tr.doc.nodesBetween(from, to, (node, pos) => {
						if (!node.isInline) return
						const own = this.type.isInSet(node.marks)?.attrs ?? {}
						const style = replaced.reduce(
							(s, property) => setStyleProp(s, property, null),
							typeof own['style'] === 'string' ? own['style'] : '',
						)
						const picked = { ...own, ...looks }
						// A step only with its colour, as the page reads it (`isTextLooks`).
						const attrs = {
							...picked,
							alpha: picked['color'] ? picked['alpha'] : null,
							style: style || null,
						}
						const [start, end] = [
							Math.max(pos, from),
							Math.min(pos + node.nodeSize, to),
						]
						if (Object.values(attrs).some(Boolean))
							tr.addMark(start, end, this.type.create(attrs))
						else tr.removeMark(start, end, this.type)
					})
					return true
				},
		}
	},
})
