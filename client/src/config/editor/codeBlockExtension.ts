import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Plugin, type Transaction } from '@tiptap/pm/state'
import { AttrStep } from '@tiptap/pm/transform'
import type { DecorationSet } from '@tiptap/pm/view'
import { lowlight } from './lowlight'

const setsLanguage = (tr: Transaction) =>
	tr.steps.some((step) => step instanceof AttrStep && step.attr === 'language')

// TipTap colours a code block again only when a change covers it, and a language set in place
// covers nothing. So its colouring (the plugin that keeps the colours as its state) also starts
// again from the page whenever a step sets a language, Undo and Redo of one too. The copy keeps
// TipTap's key, so TipTap's own drawing reads the copy's colours.
const recolourOnLanguage = (plugin: Plugin) => {
	const colours = plugin.spec.state
	if (!colours || !plugin.spec.props?.decorations) return plugin
	return new Plugin<DecorationSet>({
		...plugin.spec,
		state: {
			...colours,
			apply: (tr, value, oldState, newState) =>
				setsLanguage(tr)
					? colours.init({}, newState)
					: colours.apply(tr, value, oldState, newState),
		},
	})
}

// Every code block's <pre> wears `sf` (the theme's code-block look) and `hljs` (highlight.js
// colours), in the editor and on published pages alike.
export const CodeBlockExtension = CodeBlockLowlight.extend({
	ownLook: () => ({ class: 'sf hljs' }),
	addProseMirrorPlugins() {
		return (this.parent?.() ?? []).map(recolourOnLanguage)
	},
}).configure({ lowlight })
