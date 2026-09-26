// Bump this whenever seed.ts data changes in a way that requires a DB reseed.
// generateCss.ts warns when rootTheme.version !== SEED_VERSION; it does NOT
// auto-reseed. Run `pnpm seed:local` (dev server must be up) after bumping.
// Must be valid semver (MAJOR.MINOR.PATCH).
export const SEED_VERSION = '2.68.0'
