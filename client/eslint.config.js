import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import base from '../eslint.config.js'

export default defineConfig([
	...base,
	{ files: ['**/*.{mts,cts,vue}'], plugins: { js }, extends: ['js/recommended'] },
	{ files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'], languageOptions: { globals: globals.browser } },
	{
		// Apply Vue configs only to Vue files as they conflict with md and json files.
		files: ['**/*.vue'],
		extends: [pluginVue.configs['flat/recommended']],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				parser: tseslint.parser,
				ecmaVersion: 'latest',
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
			},
			globals: { google: 'readonly' },
		},
		rules: {
			'vue/html-indent': 'off',
			'vue/max-attributes-per-line': 'off',
			'vue/singleline-html-element-content-newline': 'off',
			// no-unused-vars set in the base is overridden by extending pluginVue.configs[...]
			'no-unused-vars': 'off',
			'vue/no-unused-vars': [
				'error',
				{
					ignorePattern: '^_',
				},
			],
		},
	},
	{
		files: ['components.d.ts'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
		},
	},
])
