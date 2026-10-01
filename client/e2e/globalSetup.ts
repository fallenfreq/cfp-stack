import type { FullConfig } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { memoryDatabase } from './d1Memory.mjs'
import { TEST_THEME_CLASS, TEST_THEME_RULES, TEST_THEME_TOKENS } from './testTheme'

// Builds the stylesheet the checks use, once per run: the seed plus the test theme, in a
// throwaway database in memory, through the real generator. The checks then depend on the code
// (api/src, read as it is now), not on whether your local database is seeded or edited.

const clientDir = dirname(dirname(fileURLToPath(import.meta.url)))
const apiDir = join(dirname(clientDir), 'api')
const outDir = join(clientDir, 'node_modules/.tmp/e2e')

export default async function globalSetup(config: FullConfig): Promise<void> {
	// Vite reads the api's TypeScript (with its .js import paths) as the preview does.
	const vite = await createServer({
		root: apiDir,
		configFile: false,
		logLevel: 'warn',
		appType: 'custom',
		server: { middlewareMode: true, hmr: false, ws: false },
		optimizeDeps: { noDiscovery: true, include: [] },
	})
	try {
		const load = (file: string) => vite.ssrLoadModule(`/@fs${join(apiDir, file)}`)
		const { seed } = await load('src/domain/seed.ts')
		const { emitStylesheet } = await load('src/domain/generateCss.ts')
		const { createTheme, getRootThemeOrThrow } = await load('src/domain/themes.ts')
		const { listTokens, setToken } = await load('src/domain/themeTokens.ts')
		const { createClassRuleTrusted } = await load('src/domain/classRules.ts')

		const db = await memoryDatabase(apiDir)
		const { brandUserId } = await seed(db)
		const seeded: string = await emitStylesheet(db)

		// The test theme only overrides tokens the seed has; a renamed token would otherwise stop
		// applying without a sound.
		const root = await getRootThemeOrThrow(db)
		const known = new Set((await listTokens(db, root.id)).map((t: { name: string }) => t.name))
		const unknown = TEST_THEME_TOKENS.filter((t) => !known.has(t.name)).map((t) => t.name)
		if (unknown.length)
			throw new Error(
				`The test theme (e2e/testTheme.ts) names tokens the seed doesn't have: ${unknown.join(', ')}`,
			)

		const theme = await createTheme(db, {
			name: 'Test',
			activationClass: TEST_THEME_CLASS,
			createdBy: brandUserId,
		})
		for (const token of TEST_THEME_TOKENS) await setToken(db, { themeId: theme.id, ...token })
		for (const rule of TEST_THEME_RULES)
			await createClassRuleTrusted(db, {
				themeId: theme.id,
				...rule,
				classNames: [...rule.classNames],
			})

		mkdirSync(outDir, { recursive: true })
		const stylesheet = join(outDir, 'sf-system.css')
		writeFileSync(stylesheet, await emitStylesheet(db))
		// Workers start after this and inherit the environment.
		process.env.SF_TEST_STYLESHEET = stylesheet

		await noteLocalDifference(config, seeded)
	} finally {
		await vite.close()
	}
}

// Pages you open by hand use your local database's stylesheet. Say when it isn't the seed's, so
// a page that looks different from what the checks test isn't a mystery. Not a failure: a local
// theme edit is allowed.
async function noteLocalDifference(config: FullConfig, seeded: string): Promise<void> {
	const baseURL = config.projects[0]?.use.baseURL
	try {
		const served = await (await fetch(`${baseURL}/styles/sf-system`)).text()
		if (served !== seeded)
			console.log(
				'\nNote: your local database serves a different stylesheet from the seed. The checks use '
					+ "the seed's; pages you open by hand use yours. `pnpm seed:local` makes them match.\n",
			)
	} catch {
		// No server to compare with.
	}
}
