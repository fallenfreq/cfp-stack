// Type-checks the packages touched by staged files (pre-commit), or every package with --all.
// Builds don't type-check; this is where type errors surface. Prints only errors.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const PACKAGES = {
	api: { dir: 'api', cmd: ['tsc', '-p', 'tsconfig.check.json'] },
	client: { dir: 'client', cmd: ['vue-tsc', '--build'] },
}

function touched() {
	const files = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
		encoding: 'utf8',
	})
		.split('\n')
		.filter((f) => /\.(ts|mts|vue|js|mjs)$/.test(f) || f.endsWith('tsconfig.json'))
	const out = new Set()
	for (const f of files) {
		if (f.startsWith('api/')) out.add('api')
		if (f.startsWith('client/')) out.add('client')
		// The client type-checks against the api schemas.
		if (f.startsWith('api/src/schemas/')) out.add('client')
	}
	return out
}

const names = process.argv.includes('--all') ? Object.keys(PACKAGES) : [...touched()]
let failed = false
for (const name of names) {
	const { dir, cmd } = PACKAGES[name]
	const [bin, ...args] = cmd
	// Package-local binary if it has one, otherwise the workspace root's.
	const local = `${dir}/node_modules/.bin/${bin}`
	const exe = existsSync(local) ? `node_modules/.bin/${bin}` : `../node_modules/.bin/${bin}`
	const r = spawnSync(exe, args, { cwd: dir, stdio: 'inherit' })
	if (r.status !== 0) {
		console.error(`\ntypecheck: ${name} has type errors`)
		failed = true
	}
}
process.exit(failed ? 1 : 0)
