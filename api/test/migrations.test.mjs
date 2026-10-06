// From api/: node --test 'test/*.test.mjs'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const MIGRATIONS = new URL('../migrations/', import.meta.url)
const QUOTE_ENDS = { "'": "'", '"': '"', '`': '`', '[': ']' }

// A SQL text's comments: from `--` to the line's end, and from `/*` to `*/`, outside quotes.
function comments(sql) {
	const found = []
	let i = 0
	while (i < sql.length) {
		const quoteEnd = QUOTE_ENDS[sql[i]]
		const [open, close] = quoteEnd
			? [sql[i], quoteEnd]
			: sql.startsWith('--', i)
				? ['--', '\n']
				: sql.startsWith('/*', i)
					? ['/*', '*/']
					: []
		if (!open) {
			i++
			continue
		}
		const end = sql.indexOf(close, i + open.length)
		const next = end === -1 ? sql.length : end + close.length
		if (!quoteEnd) found.push(sql.slice(i, next))
		i = next
	}
	return found
}

// Live D1 splits a migration at each `;` without seeing comments, so a `;` in one leaves a piece
// with no statement, and the migration fails there (docs/database.md, "Migrations").
test('no migration has a ; in a comment', () => {
	for (const folder of readdirSync(MIGRATIONS)) {
		const sql = readFileSync(new URL(`${folder}/migration.sql`, MIGRATIONS), 'utf8')
		for (const comment of comments(sql))
			assert.ok(!comment.includes(';'), `${folder}: ${comment}`)
	}
})

test('comments are found outside quotes only', () => {
	assert.deepEqual(comments('SELECT \';--\', `/*`; -- a\n/* b; */ SELECT "--" -- c'), [
		'-- a\n',
		'/* b; */',
		'-- c',
	])
})
