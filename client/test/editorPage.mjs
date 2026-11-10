// Pages built from the editor's own blocks, read as the rules take them. Quick tests draw nothing,
// so each component's drawn classes are given, as the page reader is given them.
import { getSchema, resolveExtensions } from '@tiptap/core'
import { fromHtml } from 'hast-util-from-html'
import { getContentExtensions } from '../src/config/editor/contentExtensions.ts'
import { editorComponents } from '../src/config/editor/editorComponents.ts'
import { blockWears } from '../src/editor/extensions/ownLook.ts'
import { readPage } from '../src/editor/readPage.ts'

const extensions = getContentExtensions()
export const schema = getSchema(extensions)

// A component block is named as the page writes it (`layout-stack`).
const components = Object.values(editorComponents)
const byName = new Map(components.map(({ alias, uuid }) => [alias, uuid]))
const aliasOf = new Map(components.map(({ alias, uuid }) => [uuid, alias]))

/** A block of the editor's: its name, its settings, and what's in it (text as strings). */
export const block = (name, settings = null, ...content) =>
	schema.nodes[byName.get(name) ?? name].createChecked(
		settings,
		content.map((part) => (typeof part === 'string' ? schema.text(part) : part)),
	)

/** A page holding the blocks. */
export const page = (...blocks) => schema.node('doc', null, blocks)

// What each component a test uses draws on its box, as the editor's Stack, Centre and Card do.
const drawn = {
	'layout-stack': ['sl-stack'],
	'layout-center': ['sl-center', 'sl-stack'],
	'layout-card': ['layout-card', 'sf-depth-1'],
}

// In place of the editor's drawn boxes: the component block at each position of the page.
const componentClassesOn = (doc) => (pos) => {
	const alias = aliasOf.get(doc.nodeAt(pos)?.type.name)
	if (alias && !drawn[alias]) throw new Error(`No stand-in for what ${alias} draws`)
	return alias && drawn[alias]
}

/** The page as the rules take it, each block wearing its own look or its component's classes. */
export const read = (doc) =>
	readPage(doc, blockWears(resolveExtensions(extensions), componentClassesOn(doc)))

// Without each node's place in the HTML it was read from, or the spaces between its tags.
const bare = (node) => {
	const { position: _, children, ...rest } = node
	if (!children) return rest
	return {
		...rest,
		children: children.filter((child) => child.type !== 'text' || child.value.trim()).map(bare),
	}
}

/** Elements as HTML's reader makes them, to compare with what the page reader makes. */
export const elementsOf = (html) => bare(fromHtml(html, { fragment: true }))
