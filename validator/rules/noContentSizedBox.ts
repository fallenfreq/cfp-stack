import { type CssNode, type Declaration, generate, keyword, property, walk } from '@eslint/css-tree'
import type { CssRule } from '../core.ts'

// Each case measured in Chrome: a box with the style, holding a Stack that holds a layout that
// collapses, in an 800px spot. Not followed: an absolute box with both sides set, a block that
// grows in a flex row by its own style.

// What one declaration sets of the properties read here, each with its part of the value; an
// empty part is the property's initial value. A logical size is read as its physical one.
function sets(declaration: Declaration): [name: string, parts: CssNode[]][] {
	const name = property(declaration.property).basename
	const parts = declaration.value.type === 'Value' ? [...declaration.value.children] : []
	const slash = parts.findIndex((part) => part.type === 'Operator' && part.value === '/')
	const afterSlash = slash < 0 ? [] : parts.slice(slash + 1)
	switch (name) {
		case 'inline-size':
			return [['width', parts]]
		case 'min-inline-size':
			return [['min-width', parts]]
		case 'max-inline-size':
			return [['max-width', parts]]
		case 'flex-flow':
			return [
				[
					'flex-direction',
					parts.filter((part) => words([part])[0]?.match(/^(row|column)/)),
				],
			]
		case 'place-items': {
			const [align, justify] = halves(parts)
			return [
				['align-items', align],
				['justify-items', justify],
			]
		}
		case 'place-content':
			return [['justify-content', halves(parts)[1]]]
		case 'grid-template':
			return [['grid-template-columns', afterSlash]]
		// `rows / columns`, or `rows / auto-flow columns`, which sets the columns made as needed.
		case 'grid': {
			const flows = afterSlash.some((part) => words([part])[0] === 'auto-flow')
			const columns = afterSlash.filter(
				(part) => !['auto-flow', 'dense'].includes(words([part])[0] ?? ''),
			)
			return [
				['grid-template-columns', flows ? [] : columns],
				['grid-auto-columns', flows ? columns : []],
			]
		}
		default:
			return [[name, parts]]
	}
}

// Keywords, lower case and without a vendor prefix.
const words = (parts: Iterable<CssNode>) =>
	[...parts].flatMap((part) => (part.type === 'Identifier' ? [keyword(part.name).basename] : []))

// `place-*`'s two values: up and down, then sideways, which is the first when there's one. A value
// that starts `safe`, `unsafe`, `first` or `last` is two words.
function halves(parts: CssNode[]): [CssNode[], CssNode[]] {
	const first = ['safe', 'unsafe', 'first', 'last'].includes(words(parts.slice(0, 1))[0] ?? '')
		? 2
		: 1
	const second = parts.slice(first)
	return [parts.slice(0, first), second.length ? second : parts.slice(0, first)]
}

// The box takes its content's width.
const shrinkingDisplays = new Set([
	'inline-block',
	'inline-flex',
	'inline-grid',
	'inline-table',
	'table',
	'table-cell',
])
// Two-keyword displays, as the one keyword each is.
const displayNames = new Map([
	['inline flow-root', 'inline-block'],
	['inline flex', 'inline-flex'],
	['inline grid', 'inline-grid'],
	['inline table', 'inline-table'],
	['block flex', 'flex'],
	['block grid', 'grid'],
	['block table', 'table'],
])
const contentWidths = new Set(['fit-content', 'max-content', 'min-content'])
// Items at these fill the box's width; at any other alignment they take their content's.
const stretched = new Set(['normal', 'stretch', 'legacy'])
const aligned = (alignment: readonly string[]) => alignment.some((word) => !stretched.has(word))

// A width of the box's own: a length, a percentage or a sum (not 0, a keyword or fit-content()).
// A table cell's percentage is of the table around it, which takes its content's width.
const ownWidth = (parts: readonly CssNode[] = [], percentages = true) =>
	parts.some(
		(part) =>
			((part.type === 'Dimension' || (percentages && part.type === 'Percentage'))
				&& Number(part.value) !== 0)
			|| (part.type === 'Function' && part.name.toLowerCase() !== 'fit-content'),
	)

// What sizes a list of columns: an `auto` column takes the space left over, unless an `fr`
// column takes it or the columns aren't stretched; the content keywords and fit-content() size a
// column by what's in it. Only a minmax()'s most sizes its column.
function columnKinds(parts: Iterable<CssNode>, kinds = { auto: false, fr: false, content: false }) {
	for (const part of parts) {
		const [word] = words([part])
		if (word === 'auto') kinds.auto = true
		else if (word === 'min-content' || word === 'max-content') kinds.content = true
		else if (part.type === 'Dimension' && part.unit.toLowerCase() === 'fr') kinds.fr = true
		else if (part.type === 'Function') {
			const name = part.name.toLowerCase()
			const args = [...part.children]
			const comma = args.findIndex((arg) => arg.type === 'Operator' && arg.value === ',')
			if (name === 'fit-content') kinds.content = true
			else columnKinds(name === 'minmax' ? args.slice(comma + 1) : args, kinds)
		}
	}
	return kinds
}

interface Setting {
	parts: CssNode[]
	by: Declaration
}

// The declarations in one box's style that size what's inside by its content.
function sizedByContent(box: ReadonlyMap<string, Setting>): Declaration[] {
	const found = new Set<Declaration | undefined>()
	const by = (name: string) => box.get(name)?.by
	const read = (name: string) => words(box.get(name)?.parts ?? [])
	const display = displayNames.get(read('display').join(' ')) ?? read('display').join(' ')
	const percentages = display !== 'table-cell'
	const floor = ownWidth(box.get('min-width')?.parts, percentages)
	if (!floor && !ownWidth(box.get('width')?.parts, percentages)) {
		if (shrinkingDisplays.has(display)) found.add(by('display'))
		if (read('float').some((word) => word !== 'none')) found.add(by('float'))
		if (read('position').some((word) => word === 'absolute' || word === 'fixed'))
			found.add(by('position'))
	}
	for (const name of ['width', 'max-width'])
		if (!floor && read(name).some((word) => contentWidths.has(word))) found.add(by(name))
	if (display === 'flex' || display === 'inline-flex') {
		if (!read('flex-direction').some((word) => word.startsWith('column')))
			found.add(by('display'))
		else if (aligned(read('align-items'))) found.add(by('align-items'))
	}
	if (display === 'grid' || display === 'inline-grid') {
		if (aligned(read('justify-items'))) found.add(by('justify-items'))
		// With no columns set, the grid makes them as needed, `auto` unless set otherwise.
		const template = box.get('grid-template-columns')
		const set =
			template?.parts.length && !read('grid-template-columns').includes('none')
				? template
				: undefined
		const columns = set ?? box.get('grid-auto-columns')
		const kinds = columns?.parts.length
			? columnKinds(columns.parts)
			: { auto: true, fr: false, content: false }
		if (kinds.content || (kinds.auto && kinds.fr)) found.add(columns?.by)
		else if (kinds.auto && aligned(read('justify-content'))) found.add(by('justify-content'))
	}
	return [...found].filter((declaration) => declaration !== undefined)
}

export const noContentSizedBox: CssRule = {
	name: 'no-content-sized-box',
	type: 'problem',
	check(tree, report) {
		// A box's style: a block's own, or one rule's. Read in order, so a later declaration wins,
		// unless an earlier one is !important.
		walk(tree, (style) => {
			if (style.type !== 'DeclarationList' && style.type !== 'Block') return
			const box = new Map<string, Setting>()
			for (const declaration of style.children) {
				if (declaration.type !== 'Declaration') continue
				for (const [name, parts] of sets(declaration))
					if (!box.get(name)?.by.important || declaration.important)
						box.set(name, { parts, by: declaration })
			}
			for (const declaration of sizedByContent(box))
				report({
					message: `${declaration.property}: ${generate(declaration.value)} sizes the blocks inside by their content, so a layout in it that holds a collapsing block is 0 wide: arrange them with sl- classes`,
					nodes: [declaration],
				})
		})
	},
}
