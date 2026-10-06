import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import base from '../eslint.config.js'

export default defineConfig([
	...base,
	// The base config covers the script files; this adds .vue.
	{ files: ['**/*.vue'], plugins: { js }, extends: ['js/recommended'] },
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
			'vue/multi-word-component-names': ['error', { ignores: ['Button', 'Tooltip'] }],
			// Prettier owns these (eslint-config-prettier's list of Vue rules it replaces).
			'vue/html-closing-bracket-newline': 'off',
			'vue/html-closing-bracket-spacing': 'off',
			'vue/html-end-tags': 'off',
			'vue/html-indent': 'off',
			'vue/html-quotes': 'off',
			'vue/max-attributes-per-line': 'off',
			'vue/multiline-html-element-content-newline': 'off',
			'vue/mustache-interpolation-spacing': 'off',
			'vue/no-multi-spaces': 'off',
			'vue/no-spaces-around-equal-signs-in-attribute': 'off',
			'vue/singleline-html-element-content-newline': 'off',
			// Prettier always writes void elements as <img />; the rule still self-closes empty
			// elements and components, which Prettier leaves as written.
			'vue/html-self-closing': ['error', { html: { void: 'any' } }],
			// An optional prop is left out rather than defaulted to undefined: with
			// exactOptionalPropertyTypes that stops undefined being passed by accident, and
			// left out and undefined can differ at runtime (a boolean prop left out is false).
			'vue/require-default-prop': 'off',
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
		// A ref's value read once doesn't follow it: a view that passed its address's value kept
		// the first collection's pages under the next one's title. It sees refs made in the same
		// file, not ones a composable or store hands over.
		files: ['**/*.{ts,vue}'],
		plugins: { vue: pluginVue },
		rules: { 'vue/no-ref-object-reactivity-loss': 'error' },
	},
	{
		// TipTap's useEditor empties the editor's box as it closes: a sheet sliding away showed
		// nothing. Ours leaves the page there until the box goes.
		files: ['**/*.{ts,vue}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: '@tiptap/vue-3',
							importNames: ['useEditor'],
							message: "Use useEditor from '@/composables/editor/useEditor'.",
						},
					],
				},
			],
		},
	},
])
