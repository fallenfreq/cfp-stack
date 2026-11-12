import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import base, { strictTypes } from '../eslint.config.js'

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
		// nothing. Ours leaves the page there until the box goes. highlight.js with its languages
		// tells TipTap's code block it knows them all, and it then asks ours to colour one it
		// can't, which refuses the code.
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
						...['highlight.js', 'highlight.js/lib/common'].map((name) => ({
							name,
							message:
								"Each language's rules are imported in lowlight.ts (highlight.js/lib/languages/…).",
						})),
					],
				},
			],
		},
	},
	{
		// The rules, the page reader and CSSTree are a file of their own, loaded once the editor is
		// open (pageWarnings.ts), and parse5 one loaded with the code view (codeViewCursor.ts):
		// elsewhere only their types are imported, or the editor's own file would carry them.
		files: ['src/**/*.{ts,vue}'],
		ignores: ['src/editor/pageRules.ts', 'src/editor/readPage.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/pageRules', '**/readPage', '@somefreq-app/validator/*'],
							allowTypeImports: true,
							message:
								'Loaded on its own once the editor is open: import its types only.',
						},
						{
							group: ['parse5'],
							allowTypeImports: true,
							message:
								'Loaded with the code view (codeViewCursor.ts): import its types only.',
						},
					],
				},
			],
		},
	},
	{
		// Held as strictly as the validator: what it reads from the page, and the code view's cursor.
		files: [
			'src/editor/readPage.ts',
			'src/editor/componentBoxes.ts',
			'src/editor/pageRules.ts',
			'src/editor/codeViewCursor.ts',
			'src/editor/extensions/ownLook.ts',
			'src/editor/extensions/pageWarnings.ts',
			'test/**/*.mjs',
		],
		rules: strictTypes,
	},
])
