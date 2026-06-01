import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { Extension } from '@tiptap/vue-3'

type CommandSuggestionOptions = Omit<SuggestionOptions, 'editor'> & {
	char?: string
	command?: ({ editor, range, props }: any) => void
}

export default Extension.create<{ suggestion: CommandSuggestionOptions }>({
	name: 'commands',

	addOptions() {
		return {
			suggestion: {
				char: '/',
				command: ({ editor, range, props }: any) => {
					props.command({ editor, range })
				},
			} satisfies CommandSuggestionOptions,
		}
	},

	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion,
			}),
		]
	},
})
