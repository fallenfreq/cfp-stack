import type { Config } from 'drizzle-kit'

export default {
  schema: './dist/schemas/*.js',
  out: './migrations', // This is where your migration files will be stored
  driver: 'd1', // D1 driver
  dbCredentials: {
    wranglerConfigPath: '@somefreq-app/wrangler.toml', // Path to your wrangler.toml file
    dbName: 'DB' // The binding name for your D1 database as defined in wrangler.toml
  }
} satisfies Config
