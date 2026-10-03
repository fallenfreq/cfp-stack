// Bump this whenever seed.ts data changes in a way that requires a DB reseed.
// generateCss.ts warns when rootTheme.version !== SEED_VERSION; nothing reseeds
// on its own. After bumping, run `pnpm seed:local`, and `pnpm seed:live` after the change
// is deployed (live builds the stylesheet with its own code).
// Must be valid semver (MAJOR.MINOR.PATCH).
export const SEED_VERSION = '2.87.0'
