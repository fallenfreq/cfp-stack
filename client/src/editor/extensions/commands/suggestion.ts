import SlashCommands from '@/components/editor/SlashCommands.vue'
import { editorComponents } from '@/config/editor/editorComponents'
import { getHeadingName, getNodeAlias } from '@/utils/editor/nodeRegistry'
import { type SuggestionOptions } from '@tiptap/suggestion'
import { VueRenderer, type Editor, type Range } from '@tiptap/vue-3'

type Command = (props: { editor: Editor; range: Range }) => void
interface Item {
	title: string
	command: Command
}

// The menu names each block as the node path does (getNodeAlias); bold, italic and a link, which
// aren't blocks, go by what they do.
const editorComponentItems: Item[] = Object.values(editorComponents).map((value) => ({
	title: getNodeAlias(value.uuid),
	command: ({ editor, range }) => {
		if (value.content.startsWith('inline')) {
			editor.chain().focus().deleteRange(range).setNode(value.uuid).run()
		} else {
			editor.chain().focus().deleteRange(range).wrapIn(value.uuid).run()
		}
	},
}))

const promptForYoutubeURL = (callback: (url: string) => void) => {
	const url = prompt('Enter YouTube video URL:')
	if (url) callback(url)
}

const promptForImageURL = (callback: (url: string) => void) => {
	const url = prompt('Enter Image URL:')
	if (url) callback(url)
}

const promptForTableSpec = (callback: (rows: number, cols: number) => void) => {
	const rows = prompt('Enter number of rows:')
	if (!rows) return
	const cols = prompt('Enter number of columns:')
	if (cols) callback(Number(rows), Number(cols))
}

const promptForLinkURL = (callback: (url: string) => void) => {
	const url = prompt('Enter link URL:')
	if (url) callback(url)
}

const suggestionOptions: Omit<SuggestionOptions, 'editor'> = {
	items: ({ query }: { query: string }): Item[] => {
		const generateHeadingItems = (): Item[] => {
			const items: Item[] = []
			for (let i = 1; i <= 3; i++) {
				items.push({
					title: getHeadingName(i),
					command: ({ editor, range }) =>
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.setNode('heading', { level: i })
							.run(),
				})
			}
			return items
		}

		const items: Item[] = [
			{
				title: getNodeAlias('paragraph'),
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).setNode('paragraph').run(),
			},
			...generateHeadingItems(),
			{
				title: getNodeAlias('table'),
				command: ({ editor, range }) => {
					promptForTableSpec((rows, cols) => {
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.insertTable({ rows, cols, withHeaderRow: true })
							.run()
					})
				},
			},
			{
				title: getNodeAlias('youtube'),
				command: ({ editor, range }) => {
					promptForYoutubeURL((url) => {
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.setYoutubeVideo({
								src: url,
							})
							.run()
					})
				},
			},
			{
				title: getNodeAlias('image'),
				command: ({ editor, range }) => {
					promptForImageURL((url) => {
						editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
					})
				},
			},
			{
				title: getNodeAlias('bulletList'),
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).toggleBulletList().run(),
			},
			{
				title: getNodeAlias('orderedList'),
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
			},
			{
				title: getNodeAlias('taskList'),
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).toggleTaskList().run(),
			},
			{
				title: getNodeAlias('blockquote'),
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
			},
			{
				title: getNodeAlias('horizontalRule'),
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
			},
			{
				title: 'Link',
				command: ({ editor, range }) => {
					promptForLinkURL((url) => {
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.extendMarkRange('link')
							.setLink({ href: url })
							.run()
					})
				},
			},
			{
				title: getNodeAlias('codeBlock'),
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).setNode('codeBlock').run(),
			},
			...editorComponentItems,
			{
				title: 'Bold',
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).setMark('bold').run(),
			},
			{
				title: 'Italic',
				command: ({ editor, range }) =>
					editor.chain().focus().deleteRange(range).setMark('italic').run(),
			},
		]

		return items
			.filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
			.slice(0, 7)
	},
	render: () => {
		let component: VueRenderer | null = null
		let container: HTMLElement | null = null

		return {
			onStart: (props) => {
				container = document.createElement('div')
				document.body.appendChild(container)

				component = new VueRenderer(SlashCommands, {
					props: {
						items: props.items,
						editor: props.editor,
						range: props.range,
					},
					editor: props.editor,
				})

				container.appendChild(component.element as HTMLElement)

				const rect = props.decorationNode?.getBoundingClientRect()
				if (rect) {
					container.style.position = 'absolute'
					container.style.zIndex = '1000'
					container.style.left = `${rect.left + window.scrollX}px`
					container.style.top = `${rect.bottom + window.scrollY + 10}px`
				}
			},

			onUpdate: (props) => {
				component?.updateProps(props)

				if (container) {
					const rect = props.decorationNode?.getBoundingClientRect()
					if (rect) {
						container.style.left = `${rect.left + window.scrollX}px`
						container.style.top = `${rect.bottom + window.scrollY + 10}px`
					}
				}
			},

			onKeyDown: (props) => {
				if (props.event.key === 'Escape') {
					component?.destroy()
					return true
				}
				return component?.ref?.onKeyDown(props.event) ?? false
			},

			onExit: () => {
				component?.destroy()
				component = null

				if (container) {
					container.remove()
					container = null
				}
			},
		}
	},
}

export default suggestionOptions
