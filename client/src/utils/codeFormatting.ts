import prettierPluginBabel from 'prettier/plugins/babel'
import prettierPluginEstree from 'prettier/plugins/estree'
import prettierPluginHtml from 'prettier/plugins/html'
import prettier from 'prettier/standalone'

const prettierOptions = {
	html: {
		parser: 'html',
		plugins: [prettierPluginHtml],
	},
	javascript: {
		parser: 'babel',
		plugins: [prettierPluginBabel, prettierPluginEstree, prettierPluginHtml],
	},
}

// Type guard to check if the language is a valid PrettierLanguage
function isPrettierLanguage(lang: any): lang is keyof typeof prettierOptions {
	return lang in prettierOptions
}

const prettifyCode = (code: string, language: keyof typeof prettierOptions) => {
	const { parser, plugins } = prettierOptions[language]
	return prettier.format(code, {
		parser,
		plugins,
		printWidth: 99999999,
	})
}

export { isPrettierLanguage, prettifyCode }
