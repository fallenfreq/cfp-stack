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
	trailingComma: 'all',
	plugins: [
		'prettier-plugin-organize-imports',
		'prettier-plugin-multiline-arrays',
	],
	organizeImportsSkipDestructiveCodeActions: true,
	experimentalOperatorPosition: 'start',
}

export default config
