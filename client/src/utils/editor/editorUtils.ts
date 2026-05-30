// the utils file needs editor and lowlight, both from the editor.vue
import { type Lowlight } from '@/config/editor/lowlight'
import { isPrettierLanguage, prettifyCode } from '@/utils/codeFormatting'
import { type Node as ProseMirrorNode, type ResolvedPos } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import { type Editor } from '@tiptap/vue-3'
import highlight from 'highlight.js'
import { useToast } from 'vuestic-ui'

// A position guaranteed to be the "before" offset of an existing node in the document.
// Produced only at verified entry points (resolveActive, NodeSelection.from, plugin mapResult).
declare const _nodePos: unique symbol
export type NodePos = number & { readonly [_nodePos]: true }

// Overloaded so NodePos callers get Node directly; plain number callers get Node | null.
function nodeAt(doc: ProseMirrorNode, pos: NodePos): ProseMirrorNode
function nodeAt(doc: ProseMirrorNode, pos: number): ProseMirrorNode | null
function nodeAt(doc: ProseMirrorNode, pos: number): ProseMirrorNode | null {
	return doc.nodeAt(pos)
}

const detectLanguage = (code: string, editor: Editor, setLanguage: string | null) => {
	if (setLanguage === null) {
		const lowlight = getExtensionOptions(editor, 'codeBlock')?.lowlight as Lowlight | undefined
		return lowlight?.highlightAuto(code).data?.language || null
	}
	return setLanguage
}

function getExtensionOptions<T = any>(editor: Editor, name: string): T | undefined {
	return editor.extensionManager.extensions.find((ext) => ext.name === name)?.options as
		| T
		| undefined
}

const prettifySelectedCode = async (editor: Editor) => {
	const { anchor } = editor.state.selection
	const resolvedPos = editor.state.doc.resolve(anchor)
	const startPosition = resolvedPos.start(resolvedPos.depth)
	const endPosition = resolvedPos.end(resolvedPos.depth)
	const textNode = editor.state.doc.nodeAt(startPosition)
	const selectedContent = textNode?.textContent || ''

	if (!selectedContent) return editor.chain().focus().setTextSelection(anchor).run()

	editor.commands.selectParentNode()
	const parentNode = editor.state.doc.nodeAt(editor.state.selection.from)
	const setLanguage = parentNode?.attrs.language
	const language = detectLanguage(selectedContent, editor, setLanguage)
	let message = ''
	if (language === null) {
		message = 'Auto detect failed to detect language.'
	} else if (language === undefined) {
		message = 'Formatting is only available for code blocks.'
	} else if (!isPrettierLanguage(language)) {
		const languageName = highlight.getLanguage(language)?.name?.split(',')[0]
		message = `Formatting is not supported for the detected language: ${languageName}`
	}

	if (!language || !isPrettierLanguage(language)) {
		useToast().notify({
			duration: 10000,
			color: 'warning',
			position: 'bottom-right',
			message,
		})
		return
	}

	try {
		const formattedContent = await prettifyCode(selectedContent, language)

		editor.commands.insertContentAt(
			{ from: startPosition, to: endPosition },
			{ type: 'text', text: formattedContent },
		)
	} catch (error) {
		useToast().notify({
			duration: 10000,
			color: 'danger',
			position: 'bottom-right',
			message:
				'Formatting error: ' + (error instanceof Error ? error.message : 'Unknown error'),
		})
	}
	editor.chain().focus().setTextSelection(anchor).run()
}

const isAbsent = (v: unknown) => v === null || v === undefined || v === ''

// Returns only attrs whose value differs from the schema default.
// null, undefined, and '' are all treated as "not set" — if the spec default is absent,
// any absent value is excluded regardless of exact form.
// Pass `required` to force-include one key regardless (used by code view for data-container etc.)
const filterNonDefaultAttrs = (
	attrs: Record<string, unknown>,
	specAttrs: Record<string, { default?: unknown }>,
	required?: string,
): Record<string, unknown> =>
	Object.fromEntries(
		Object.entries(attrs).filter(([key, value]) => {
			if (key === required) return true
			const def = specAttrs[key]?.default ?? null
			return isAbsent(def) ? !isAbsent(value) : value !== def
		}),
	)

// Returns the "before" positions of all siblings of the node at nodePos (including itself).
const getSiblingPositions = (doc: ProseMirrorNode, nodePos: NodePos): NodePos[] => {
	const $pos = doc.resolve(nodePos)
	const parentDepth = $pos.depth
	const parent = $pos.node(parentDepth)
	const parentStart = $pos.start(parentDepth)
	const positions: NodePos[] = []
	parent.forEach((_, offset) => {
		positions.push((parentStart + offset) as NodePos)
	})
	return positions
}

// Returns the "before" positions of all direct block children of the node at nodePos.
const getChildBlockPositions = (doc: ProseMirrorNode, nodePos: NodePos): NodePos[] => {
	const node = nodeAt(doc, nodePos)
	const contentStart = (nodePos + 1) as NodePos
	const positions: NodePos[] = []
	node.forEach((child, offset) => {
		if (child.isBlock) positions.push((contentStart + offset) as NodePos)
	})
	return positions
}

// Trusted entry points for creating NodePos values from ProseMirror APIs.
// All as-NodePos casts in the codebase must live here.
const nodeSelectionPos = (selection: NodeSelection): NodePos => selection.from as NodePos
const resolvedNodePos = ($pos: ResolvedPos, depth: number): NodePos =>
	$pos.before(depth) as NodePos

// Returns true if all positions share the same parent (i.e. are siblings of each other).
const allAreSiblings = (doc: ProseMirrorNode, positions: NodePos[]): boolean => {
	const [first, ...rest] = positions
	if (first === undefined) return true
	const siblingSet = new Set(getSiblingPositions(doc, first))
	return rest.every((pos) => siblingSet.has(pos))
}

export {
	allAreSiblings,
	filterNonDefaultAttrs,
	getChildBlockPositions,
	getExtensionOptions,
	getSiblingPositions,
	nodeAt,
	nodeSelectionPos,
	prettifySelectedCode,
	resolvedNodePos,
}
