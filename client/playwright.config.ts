import { defineConfig } from '@playwright/test'
import type { ThemeOption } from './e2e/fixtures'
import { TEST_THEME_CLASS } from './e2e/testTheme'

// Layout checks in a real browser (client/e2e), run with `pnpm test:ui`. They use the installed
// Chrome and the dev server on 8788 (wrangler serves the built client and the API), starting it
// if it isn't running. The stylesheet is built from the seed in memory (e2e/globalSetup.ts), and
// every check runs under the root theme and again under a deliberately different test theme.
export default defineConfig<ThemeOption>({
	testDir: './e2e',
	snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{arg}{ext}',
	globalSetup: './e2e/globalSetup.ts',
	fullyParallel: true,
	workers: 4,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:8788',
		channel: 'chrome',
		viewport: { width: 1440, height: 900 },
	},
	projects: [
		{ name: 'root theme' },
		{
			name: 'test theme',
			use: { themeClass: TEST_THEME_CLASS },
			// The demo page is checked as it looks; the theme check compares the two itself.
			testIgnore: ['demo.spec.ts', 'theme.spec.ts'],
		},
	],
	webServer: {
		command: 'pnpm dev',
		cwd: '..',
		url: 'http://localhost:8788',
		reuseExistingServer: true,
		timeout: 180_000,
	},
})
