// From client/: pnpm test.
import { EditorState, NodeSelection } from '@tiptap/pm/state'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	nextWarned,
	pageWarnings,
	pageWarningsPlugin,
	warningsOn,
	withWarnings,
} from '../src/editor/extensions/pageWarnings.ts'
import { checkPage } from '../src/editor/pageRules.ts'
import { block, page, schema, wearsOn } from './editorPage.mjs'

// Nothing is drawn here, so the rules are run by hand, as the plugin's view runs them.
const plugin = pageWarningsPlugin(() => {
	throw new Error('Asked only once the page is drawn')
})

/** The page as the editor holds it once the rules have run. */
const checked = (doc) => {
	const state = EditorState.create({ doc, plugins: [plugin] })
	return state.apply(withWarnings(state.tr, checkPage(doc, wearsOn(doc))))
}

// Each mark: where it is, and its class.
const marksOf = (state) =>
	plugin.props.decorations
		.call(plugin, state)
		.find()
		.map((mark) => [mark.from, mark.type.attrs.class])

test("an inline piece's warning shows on it and on its line, not on a piece between", () => {
	// At 0 the line, at 3 a span, at 4 the span in it, whose style has a container unit.
	const doc = page(
		block(
			'paragraph',
			null,
			'x ',
			block('span', null, block('span', { style: 'width: 10cqw' }, 'a')),
		),
	)
	const state = checked(doc)
	assert.deepEqual(
		[0, 3, 4].map((pos) => warningsOn(state, pos).length),
		[1, 0, 1],
	)
	assert.deepEqual(marksOf(state), [[4, 'sf-is-error']])
	assert.equal(nextWarned(state), 0)
})

test('the next block with a warning is the next after the selection, then the first', () => {
	// Lines at 0, 2 and 4; the first and last share an id.
	const doc = page(
		block('paragraph', { id: 'intro' }),
		block('paragraph'),
		block('paragraph', { id: 'intro' }),
	)
	const state = checked(doc)
	assert.equal(state.selection.from, 1)
	assert.equal(nextWarned(state), 4)
	const onLast = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 4)))
	assert.equal(nextWarned(onLast), 0)
})

test('a block a problem names is marked as one, else as a suggestion', () => {
	// Videos at 0 and 1: centred, the usual way pointed out; centred and bleeding, a problem too.
	const video = (classes) => block('youtube', { src: 'https://youtu.be/x', class: classes })
	const state = checked(page(video('sl-center'), video('sl-center sl-bleed')))
	assert.deepEqual(marksOf(state), [
		[0, 'sf-is-warning'],
		[1, 'sf-is-error'],
	])
})

test('the warnings and marks follow the page until the rules run again', () => {
	const doc = page(block('paragraph', { id: 'intro' }), block('paragraph', { id: 'intro' }))
	const state = checked(doc)
	const moved = state.apply(state.tr.insert(0, schema.nodes.paragraph.create()))
	assert.deepEqual(pageWarnings(moved)[0].blocks, [2, 4])
	assert.deepEqual(marksOf(moved), [
		[2, 'sf-is-error'],
		[4, 'sf-is-error'],
	])
})
