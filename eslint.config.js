import js from '@eslint/js'
import json from '@eslint/json'
import markdown from '@eslint/markdown'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
	globalIgnores(
		['**/dist', '**/node_modules', '**/_demos', './api/{client_dist, functions}'],
		'Global Ignores',
	),
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: { globals: globals.node },
	},
	tseslint.configs.strict,
	tseslint.configs.stylistic,
	{
		files: ['**/*.json'],
		ignores: ['tsconfig.*json'],
		plugins: { json },
		language: 'json/json',
		extends: ['json/recommended'],
	},
	{
		files: ['**/*.jsonc', '**/tsconfig.*json', '.vscode/settings.json'],
		plugins: { json },
		language: 'json/jsonc',
		extends: ['json/recommended'],
	},
	{
		files: ['**/*.md'],
		plugins: { markdown },
		language: 'markdown/commonmark',
		extends: ['markdown/recommended'],
	},
	// This can be used isolated to add individual rules over prettier
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
		plugins: {
			'@stylistic': stylistic,
		},
		languageOptions: { parser: tseslint.parser, sourceType: 'module', globals: globals.node },
		rules: {
			// Handled by prettier's "experimentalOperatorPosition: 'start'" option
			// '@stylistic/operator-linebreak': ['error', 'before'],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-dynamic-delete': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
])
