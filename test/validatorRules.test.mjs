// From the root: node --test 'test/*.test.mjs'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { sectionNames } from './docs.mjs'

const ROOT = new URL('../', import.meta.url)
const RULES = new URL('validator/rules/', ROOT)
const SPEC = new URL('client/src/assets/sf-system.md', ROOT)

// A rule's name is its entry in the spec's list, which names the section that gives its reason.
test('each rule file holds one rule, named as its own entry in the spec', async () => {
	const files = readdirSync(RULES).filter((file) => file.endsWith('.ts'))
	const rules = []
	for (const file of files) {
		const exported = Object.values(await import(new URL(file, RULES).href))
		rules.push(...exported.filter((value) => typeof value?.check === 'function'))
	}
	assert.equal(rules.length, files.length, 'a rule file without exactly one rule')
	const names = rules.map(({ name }) => name)
	assert.deepEqual(
		names.filter((name, index) => names.indexOf(name) !== index),
		[],
		'two rules share a name',
	)
	const sections = sectionNames(readFileSync(SPEC, 'utf8'))
	assert.deepEqual(
		names.filter((name) => !sections.has(name)),
		[],
		'a rule with no entry in the spec',
	)
})
