// Bump this whenever seed.ts data changes in a way that requires a DB reseed.
// The sf-system CSS endpoint compares this against the stored root theme version
// and auto-reseeds on mismatch, so the local DB self-heals without manual steps.
// Must be valid semver (MAJOR.MINOR.PATCH).
export const SEED_VERSION = '2.6.0'
