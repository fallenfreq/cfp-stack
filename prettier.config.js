/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
	semi: false,
	useTabs: true,
	tabWidth: 2,
	singleQuote: true,
	printWidth: 100,
	trailingComma: 'none',
	plugins: ['prettier-plugin-organize-imports']
}

export default config
