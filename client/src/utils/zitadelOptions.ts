// Zitadel's officially supported UI/email languages — the only values that affect
// login page and email templates. Fetching the allowed list requires admin auth
// (GET /admin/v1/languages/allowed or GET /management/v1/languages), so we hardcode
// the known set here instead.
export const languageOptions = [
	{ text: 'Not set', value: '' },
	{ text: 'Bulgarian', value: 'bg' },
	{ text: 'Czech', value: 'cs' },
	{ text: 'German', value: 'de' },
	{ text: 'English', value: 'en' },
	{ text: 'Spanish', value: 'es' },
	{ text: 'Finnish', value: 'fi' },
	{ text: 'French', value: 'fr' },
	{ text: 'Hungarian', value: 'hu' },
	{ text: 'Indonesian', value: 'id' },
	{ text: 'Italian', value: 'it' },
	{ text: 'Japanese', value: 'ja' },
	{ text: 'Korean', value: 'ko' },
	{ text: 'Macedonian', value: 'mk' },
	{ text: 'Dutch', value: 'nl' },
	{ text: 'Polish', value: 'pl' },
	{ text: 'Portuguese', value: 'pt' },
	{ text: 'Russian', value: 'ru' },
	{ text: 'Swedish', value: 'sv' },
	{ text: 'Ukrainian', value: 'uk' },
	{ text: 'Chinese', value: 'zh' },
]

export const genderOptions = [
	{ text: 'Unspecified', value: '' },
	{ text: 'Male', value: 'GENDER_MALE' },
	{ text: 'Female', value: 'GENDER_FEMALE' },
	{ text: 'Diverse', value: 'GENDER_DIVERSE' },
]

// Zitadel stores locales with BCP47 Unicode extensions (e.g. en-u-rg-uszzzz).
// Strip the extension, then fall back to the base language if the result isn't
// in our known list (e.g. de-AT → de).
export function normalizeLocale(locale: string): string {
	const stripped = locale.replace(/-u-.*/i, '')
	if (languageOptions.some((o) => o.value === stripped)) return stripped
	const base = stripped.split('-')[0]
	return languageOptions.some((o) => o.value === base) ? base : ''
}
