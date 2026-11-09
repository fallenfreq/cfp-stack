// From validator/: pnpm test.
import { fromHtml } from 'hast-util-from-html'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { check } from '../core.ts'
import { noDuplicateId } from '../rules/noDuplicateId.ts'

const page = () => fromHtml('<p id="intro">One</p><p id="intro">Two</p>', { fragment: true })

// A rule that reports each message on the page's first element.
const reporting = (name, ...messages) => ({
	name,
	type: 'suggestion',
	check: (tree, report) => {
		for (const message of messages) report({ message, nodes: [tree.children[0]] })
	},
})

test('a result is the rule, its type and the nodes it was given', () => {
	const tree = page()
	const [first, second] = tree.children
	const results = check(tree, [noDuplicateId])
	assert.deepEqual(results, [
		{
			rule: 'no-duplicate-id',
			type: 'problem',
			message: '2 blocks share the id "intro"',
			nodes: [first, second],
		},
	])
	assert.equal(results[0].nodes[0], first)
	assert.equal(results[0].nodes[1], second)
})

test('results come rule by rule, each in the order it reports them', () => {
	const results = check(page(), [reporting('b', 'b1', 'b2'), reporting('a', 'a1')])
	assert.deepEqual(
		results.map(({ rule, message }) => `${rule}: ${message}`),
		['b: b1', 'b: b2', 'a: a1'],
	)
})

test('no rules are no result', () => {
	assert.deepEqual(check(page(), []), [])
})
