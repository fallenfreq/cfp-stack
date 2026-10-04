import type { Config } from 'drizzle-kit'

export default {
	schema: './dist/schemas/*.js',
	out: './migrations',
	driver: 'd1',
	dbCredentials: {
		wranglerConfigPath: '@somefreq-app/wrangler.toml',
		dbName: 'DB',
	},
} satisfies Config
