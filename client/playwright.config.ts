import { defineConfig } from '@playwright/test'
import type { ThemeOption } from './e2e/fixtures'
import { TEST_THEME_CLASS } from './e2e/testTheme'

// Layout checks in a real browser (client/e2e), run with `pnpm test:ui`. They use the installed
// Chrome and Playwright's WebKit (Safari's engine), and the dev server on 8788 (wrangler serves
// the built client and the API), starting it if it isn't running. The stylesheet is built from the
// seed in memory (e2e/globalSetup.ts). In each browser, every check runs under the root theme and
// again under a deliberately different test theme; the demo page's and the theme comparison once.
const themes = [
	{ name: 'root theme', use: {} },
	{
		name: 'test theme',
		use: { themeClass: TEST_THEME_CLASS },
		// The demo page is checked as it looks; the theme check compares the two itself.
		testIgnore: ['demo.spec.ts', 'theme.spec.ts'],
	},
]

export default defineConfig<ThemeOption>({
	testDir: './e2e',
	snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{arg}{ext}',
	globalSetup: './e2e/globalSetup.ts',
	fullyParallel: true,
	workers: 4,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:8788',
		viewport: { width: 1440, height: 900 },
	},
	projects: [
		...themes.map((theme) => ({
			...theme,
			name: `Chrome, ${theme.name}`,
			use: { ...theme.use, channel: 'chrome' },
		})),
		...themes.map((theme) => ({
			...theme,
			name: `WebKit, ${theme.name}`,
			use: { ...theme.use, browserName: 'webkit' as const },
			// WebKit draws text and form controls a little differently: its own accepted demo page.
			snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/webkit/{arg}{ext}',
		})),
	],
	webServer: {
		command: 'pnpm dev',
		cwd: '..',
		url: 'http://localhost:8788',
		reuseExistingServer: true,
		timeout: 180_000,
	},
})
