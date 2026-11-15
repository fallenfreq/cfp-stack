import { TaskItem, type TaskItemOptions } from '@tiptap/extension-list'
import type { Node as PMNode } from '@tiptap/pm/model'
import { mergeAttributes } from '@tiptap/vue-3'

export const CustomTaskItem = TaskItem.extend<TaskItemOptions>({
	// Checkbox beside the item's content: fixed side + flexible side.
	ownLook: () => ({ class: 'sl-split sf-gap-md' }),

	// The item's text is in the item itself (its own markup), or in the div after a tick box
	// (TipTap's, pasted). Replaces TipTap's rule, which from 3.30 takes the first div anywhere,
	// losing text before a Div block.
	parseHTML() {
		return [
			{
				tag: `li[data-type="${this.name}"]`,
				priority: 51,
				contentElement: (li) => li.querySelector(':scope > label + div') ?? li,
			},
		]
	},

	// Written as its settings and its content, as a component is; its view draws the tick box.
	// TipTap writes the box too, a second tick beside `data-checked` that the page doesn't read.
	renderHTML({ HTMLAttributes }) {
		return [
			'li',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				'data-type': this.name,
			}),
			0,
		]
	},

	// TipTap's item sets its own attributes again on each update, so a class of its own would
	// replace what's drawn with it: its look and the selection's. Redraw the item when anything but the
	// tick changes (a removed id or style goes too); ticks and typing update in place, keeping the
	// class as drawn.
	addNodeView() {
		const create = this.parent?.()
		return (props) => {
			const view = create!(props)
			const dom = view.dom as HTMLElement
			let shown = props.node
			const onlyTicked = (node: PMNode) =>
				node.type === shown.type
				&& Object.keys(node.attrs).every(
					(name) => name === 'checked' || node.attrs[name] === shown.attrs[name],
				)
			return {
				...view,
				update: (node, decorations, innerDecorations) => {
					if (!onlyTicked(node)) return false
					const drawn = dom.className
					if (!view.update?.(node, decorations, innerDecorations)) return false
					dom.className = drawn
					shown = node
					return true
				},
			}
		}
	},
})
