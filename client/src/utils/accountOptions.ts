import { splitFirst } from './stringUtils'

// The choices on the account form. The languages are those the sign-in provider (Zitadel) has
// sign-in pages and emails in — the only ones that change anything. Fetching its allowed list
// needs admin rights, so the known set is here instead.
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
	{ text: 'Male', value: 'male' },
	{ text: 'Female', value: 'female' },
	{ text: 'Diverse', value: 'diverse' },
] as const

// A language the list has: as it is, else its base language (de-AT → de), else not set.
export function knownLanguage(language: string): string {
	if (languageOptions.some((o) => o.value === language)) return language
	const base = splitFirst(language, '-')
	return languageOptions.some((o) => o.value === base) ? base : ''
}
