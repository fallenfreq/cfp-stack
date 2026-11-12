import { createLowlight, type LanguageFn } from 'lowlight'

import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import markdown from 'highlight.js/lib/languages/markdown'
import php from 'highlight.js/lib/languages/php'
import python from 'highlight.js/lib/languages/python'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import swift from 'highlight.js/lib/languages/swift'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

// The languages a code block is coloured in, as the Language picker offers them: each by the one
// name the page keeps (`language-cpp`) and the name people know it by. Its rules also read its own
// short names (`js` is JavaScript). A code block in another language, or none, is plain.
const languages: Record<string, { name: string; rules: LanguageFn }> = {
	html: { name: 'HTML', rules: xml },
	css: { name: 'CSS', rules: css },
	javascript: { name: 'JavaScript', rules: javascript },
	typescript: { name: 'TypeScript', rules: typescript },
	json: { name: 'JSON', rules: json },
	python: { name: 'Python', rules: python },
	bash: { name: 'Bash', rules: bash },
	sql: { name: 'SQL', rules: sql },
	yaml: { name: 'YAML', rules: yaml },
	markdown: { name: 'Markdown', rules: markdown },
	c: { name: 'C', rules: c },
	cpp: { name: 'C++', rules: cpp },
	csharp: { name: 'C#', rules: csharp },
	java: { name: 'Java', rules: java },
	go: { name: 'Go', rules: go },
	rust: { name: 'Rust', rules: rust },
	php: { name: 'PHP', rules: php },
	ruby: { name: 'Ruby', rules: ruby },
	swift: { name: 'Swift', rules: swift },
	kotlin: { name: 'Kotlin', rules: kotlin },
}

const colours = createLowlight(
	Object.fromEntries(Object.entries(languages).map(([language, { rules }]) => [language, rules])),
)

// TipTap's code block guesses the language of a block with none it colours, and a guess can be
// wrong: here it's no colours.
const lowlight: typeof colours = {
	...colours,
	highlightAuto: (value) => ({ type: 'root', children: [{ type: 'text', value }] }),
}

type Lowlight = typeof lowlight
export { languages, lowlight, type Lowlight }
