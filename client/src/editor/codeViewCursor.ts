import { underTheBar } from '@/editor/extensions/rememberCursor'
import { prettifyCode } from '@/utils/codeFormatting'
import { codeViewHtml } from '@/utils/editor/codeViewHtml'
import { elementFromString } from '@tiptap/core'
import { DOMParser, type Node as PMNode } from '@tiptap/pm/model'
import { type EditorState, NodeSelection, Selection, TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { DefaultTreeAdapterTypes, Token } from 'parse5'

// The cursor across the code view. Each way, a marker goes where the cursor is, the page converts
// as it always does (writes itself as code, or reads the code), and the cursor goes where the marker
// lands: the code is the page's own, read as the page reads it. Where each tag and text is in the
// code, which the page's reading doesn't keep, is parse5's, which reads HTML as the browser does:
// Prettier's reader refuses code the page reads, and a count of `<` would take one typed in text
// for a tag. It loads as the code view opens (43 KB gzipped), so it's there by the time it closes.

/** The code view's selection, as places in its code. */
export interface CodeCursor {
	anchor: number
	head: number
}

// Two characters for markers, one for each end, that `text` doesn't hold: from Unicode's private
// use, which a page holds only from an icon font's glyphs (Material Icons' "error" is U+E000).
const markersFor = (text: string): [anchor: string, head: string] => {
	const unused = (after: number) => {
		let point = after + 1
		while (text.includes(String.fromCodePoint(point))) point++
		return point
	}
	const anchor = unused(0xdfff)
	return [String.fromCodePoint(anchor), String.fromCodePoint(unused(anchor))]
}

// Without parse5 (it couldn't load; the next opening tries again) a selected block goes as the text
// nearest it, and a place in a tag is lost, as the marker breaks the tag.
let parse5: typeof import('parse5') | null = null
let loading: Promise<unknown> | undefined
const loadParse5 = () =>
	(loading ??= import('parse5').then(
		(loaded) => (parse5 = loaded),
		() => (loading = undefined),
	))

// The page reads code in a body (TipTap's elementFromString), and so does parse5 here.
const BODY = '<body>'

// A tag's place in the code, and which: one opening a block, closing one, or a block's whole tag
// (a picture's).
interface Tag {
	from: number
	to: number
	kind: 'opens' | 'closes' | 'whole'
}

// The code's elements, its tags, and where it has text other than spaces between tags.
const read = (code: string) => {
	const elements: DefaultTreeAdapterTypes.Element[] = []
	const tags: Tag[] = []
	const texts: { from: number; to: number }[] = []
	if (!parse5) return { elements, tags, texts }
	const { defaultTreeAdapter: tree } = parse5
	const place = ({ startOffset, endOffset }: Token.Location) => ({
		from: startOffset - BODY.length,
		to: endOffset - BODY.length,
	})
	const walk = (parent: DefaultTreeAdapterTypes.ParentNode) => {
		for (const child of tree.getChildNodes(parent)) {
			if (tree.isTextNode(child) && child.sourceCodeLocation && /\S/.test(child.value))
				texts.push(place(child.sourceCodeLocation))
			if (!tree.isElementNode(child)) continue
			elements.push(child)
			const at = child.sourceCodeLocation
			if (at?.startTag && at.endTag)
				tags.push(
					{ ...place(at.startTag), kind: 'opens' },
					{ ...place(at.endTag), kind: 'closes' },
				)
			else if (at?.startTag)
				tags.push({
					...place(at.startTag),
					kind: child.childNodes.length ? 'opens' : 'whole',
				})
			walk(child)
		}
	}
	walk(parse5.parse(`${BODY}${code}</body>`, { sourceCodeLocationInfo: true }))
	return { elements, tags, texts }
}

const write = (doc: PMNode) => prettifyCode(codeViewHtml(doc), 'html')

// The code with the markers taken out, and where each was; no cursor if one is missing.
const takeOut = (
	written: string,
	[
		anchorMark,
		headMark,
	]: [
		string,
		string,
	],
) => {
	const anchor = written.indexOf(anchorMark)
	const head = written.indexOf(headMark)
	return {
		code: written.replace(anchorMark, '').replace(headMark, ''),
		cursor:
			anchor < 0 || head < 0
				? null
				: { anchor: anchor - Number(head < anchor), head: head - Number(anchor < head) },
	}
}

// A selected block's whole code, found by a marker put in its id on a copy of the page: every
// block takes an id (allowAttributesExtension.ts).
const blockCode = async (state: EditorState, { from, node }: NodeSelection, marker: string) => {
	const id: unknown = node.attrs['id']
	const own = typeof id === 'string' ? id : ''
	const written = await write(state.tr.setNodeAttribute(from, 'id', marker + own).doc)
	const element = read(written).elements.find(({ attrs }) =>
		attrs.some(({ name, value }) => name === 'id' && value.startsWith(marker)),
	)
	const at = element?.sourceCodeLocation
	const idAt = at?.attrs?.['id']
	if (!at || !idAt) return null
	// The marker out: its character, or the id it made with the space before it.
	const markerAt = written.indexOf(marker)
	const [cutFrom, cutTo] = own
		? [markerAt, markerAt + 1]
		: [
				written.slice(0, idAt.startOffset - BODY.length).trimEnd().length,
				idAt.endOffset - BODY.length,
			]
	return {
		code: written.slice(0, cutFrom) + written.slice(cutTo),
		cursor: {
			anchor: at.startOffset - BODY.length,
			head: at.endOffset - BODY.length - (cutTo - cutFrom),
		},
	}
}

/**
 * The page as code for the code view, and where its cursor goes: the same place in the text, or a
 * selected block's whole code. A selection of neither (table cells, the whole page) goes as the text
 * nearest its ends.
 */
export const codeWithCursor = async (
	state: EditorState,
): Promise<{ code: string; cursor: CodeCursor | null }> => {
	// Loading for the way back too; only a selected block waits for it.
	const loaded = loadParse5()
	const { selection, tr } = state
	const markers = markersFor(codeViewHtml(state.doc))
	if (selection instanceof NodeSelection) {
		await loaded
		const block = await blockCode(state, selection, markers[0])
		if (block) return block
	}
	const { anchor, head } = TextSelection.between(selection.$anchor, selection.$head)
	// The later end first, so the earlier keeps its place; in the marks around it, as typing is.
	const ends: [at: number, marker: string][] = [
		[anchor, markers[0]],
		[head, markers[1]],
	]
	for (const [at, marker] of ends.sort(([a], [b]) => b - a))
		tr.insert(at, state.schema.text(marker, tr.doc.resolve(at).marks()))
	return takeOut(await write(tr.doc), markers)
}

// A place in an opening tag moves just before it, and goes forward into its block; one in a tag
// that ends a block (a closing tag, a picture's), just after it, and goes back. Elsewhere, not in
// text, the page's cursor looks toward the tag next to it on its line: back if that tag ends a
// block before it (the line's block) or closes one after it (`</td>` at the start of a line), and
// forward otherwise.
const outsideTags = (tags: readonly Tag[], code: string, at: number) => {
	const around = tags.find(({ from, to }) => from < at && at < to)
	if (around)
		return around.kind === 'opens'
			? { at: around.from, lookBack: false }
			: { at: around.to, lookBack: true }
	const onItsLine = (from: number, to: number) => !code.slice(from, to).includes('\n')
	let before: Tag | undefined
	let after: Tag | undefined
	for (const tag of tags) {
		if (tag.to <= at && (!before || tag.to > before.to)) before = tag
		if (tag.from >= at && (!after || tag.from < after.from)) after = tag
	}
	const lookBack =
		before && onItsLine(before.to, at)
			? before.kind !== 'opens'
			: !!after && onItsLine(at, after.from) && after.kind === 'closes'
	return { at, lookBack }
}

// A place in the code's tree, for ProseMirror's reader to say where on the page it is (`pos`).
interface Found {
	node: Node
	offset: number
	pos?: number
}

/**
 * Where the page's cursor goes for the code view's `cursor` in `code`, which the page `doc` was read
 * from: the same place in the text, or the nearest the page has; a block whose whole code is
 * selected is selected. Null if the code puts it nowhere (in a video's empty content, or in a
 * character reference such as `&amp;`).
 */
export const cursorFromCode = (code: string, cursor: CodeCursor, doc: PMNode): Selection | null => {
	const { tags, texts } = read(code)
	const anchor = outsideTags(tags, code, cursor.anchor)
	const head = outsideTags(tags, code, cursor.head)
	const [anchorMark, headMark] = markersFor(code)
	// In text, a character, which joins the text, as going in (a comment splits it, and the page
	// drops a line break left on its own); between tags, a comment, which the browser keeps where
	// it's written (in a table too, where it moves text out) and the page leaves out.
	const inText = (at: number) => texts.some(({ from, to }) => from <= at && at <= to)
	const ends: [at: number, marker: string][] = [
		[anchor.at, anchorMark],
		[head.at, headMark],
	]
	let marked = code
	for (const [at, marker] of ends.sort(([a], [b]) => b - a))
		marked = `${marked.slice(0, at)}${inText(at) ? marker : `<!--${marker}-->`}${marked.slice(at)}`
	const dom = elementFromString(marked)
	// Where each was, as the page reads the code without them, each taken out in turn: in its text,
	// or between the nodes it's among.
	const found = new Map<string, Found[]>()
	const walker = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT)
	const markedNodes: (Text | Comment)[] = []
	for (let node = walker.nextNode(); node; node = walker.nextNode())
		if (
			(node instanceof Text || node instanceof Comment)
			&& (node.data.includes(anchorMark) || node.data.includes(headMark))
		)
			markedNodes.push(node)
	for (const node of markedNodes) {
		let index = 0
		for (let before = node.previousSibling; before; before = before.previousSibling) index++
		const between = { node: node.parentNode ?? dom, offset: index }
		if (node instanceof Comment) {
			found.set(node.data, [between])
			node.remove()
			continue
		}
		// The earlier first, so the later's place is counted without it.
		const { data } = node
		const markers = [anchorMark, headMark].filter((marker) => data.includes(marker))
		for (const marker of markers.sort((x, y) => data.indexOf(x) - data.indexOf(y))) {
			const offset = node.data.indexOf(marker)
			node.data = node.data.replace(marker, '')
			found.set(marker, [{ node, offset }, between])
		}
	}
	const a = found.get(anchorMark)
	const h = found.get(headMark)
	if (!a || !h) return null
	const parser = DOMParser.fromSchema(doc.type.schema)
	const markedRead = parser.parse(dom, { findPositions: [...a, ...h] })
	// The markers moved nothing: the code reads as it does without them.
	if (!markedRead.eq(parser.parse(elementFromString(code)))) return null
	const posOf = (finds: readonly Found[]) => finds.find(({ pos }) => pos !== undefined)?.pos
	const anchorPos = posOf(a)
	const headPos = posOf(h)
	if (anchorPos === undefined || headPos === undefined) return null
	const from = Math.min(anchorPos, headPos)
	const to = Math.max(anchorPos, headPos)
	if (to > doc.content.size) return null
	// Any block, as the node path selects one: a component block is `selectable: false` only to
	// clicks and drags (customComponentNode.ts). Not a run of text, which is text selected.
	const block = doc.resolve(from).nodeAfter
	if (from < to && block && !block.isText && from + block.nodeSize === to)
		return NodeSelection.create(doc, from)
	if (from < to) return TextSelection.between(doc.resolve(anchorPos), doc.resolve(headPos))
	const $at = doc.resolve(from)
	return $at.parent.inlineContent
		? TextSelection.create(doc, from)
		: Selection.near($at, anchor.lookBack ? -1 : 1)
}

/**
 * The height on the screen to keep the line at `pos` at as the other view shows: where it is, or
 * just under the editor's top bar if it's off the screen.
 */
export const lineOnScreen = (view: EditorView, pos: number) => {
	const { top, bottom } = view.coordsAtPos(pos)
	return top >= underTheBar() && bottom <= innerHeight ? top : underTheBar()
}

/** Scrolls the line at `pos` to `top` on the screen. */
export const scrollLineTo = (view: EditorView, pos: number, top: number) =>
	scrollBy({ top: view.coordsAtPos(pos).top - top })
