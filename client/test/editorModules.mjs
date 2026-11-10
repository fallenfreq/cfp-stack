// Lets Node load the editor's code as the client's build does (`node --import`): its `@/` paths,
// its files named without their ending (`./codeBlockExtension`), and its components (`.vue`) as
// empty ones, as no quick test draws one.
import { registerHooks } from 'node:module'

const SOURCE = new URL('../src/', import.meta.url)

registerHooks({
	resolve(specifier, context, next) {
		const named = specifier.startsWith('@/')
			? new URL(specifier.slice(2), SOURCE).href
			: specifier
		try {
			return next(named, context)
		} catch (error) {
			if (!named.startsWith('.') && !named.startsWith('file:')) throw error
			return next(`${named}.ts`, context)
		}
	},
	load(url, context, next) {
		if (url.endsWith('.vue'))
			return { format: 'module', source: 'export default {}', shortCircuit: true }
		return next(url, context)
	},
})
