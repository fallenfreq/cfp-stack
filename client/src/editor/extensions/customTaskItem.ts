import { TaskItem, type TaskItemOptions } from '@tiptap/extension-list'
import type { Node as PMNode } from '@tiptap/pm/model'
import { mergeAttributes } from '@tiptap/vue-3'

// Mobile drag-select that crosses a selectable:true block converts to a
// NodeSelection — native touch handles vanish and the synthetic click on the
// checkbox toggles it.  dragHandle.ts spans the node with a TextSelection for
// selectable:false nodes so the gutter handle still drags task items.
export const CustomTaskItem = TaskItem.extend<TaskItemOptions>({
	selectable: false,

	// The item's text is in the div after its tick box (TipTap's markup), else in the item itself.
	// Replaces TipTap's rule, which from 3.30 takes the first div anywhere, losing text before a
	// Div block.
	parseHTML() {
		return [
			{
				tag: `li[data-type="${this.name}"]`,
				priority: 51,
				contentElement: (li) => li.querySelector(':scope > label + div') ?? li,
			},
		]
	},

	// TipTap's item sets its own attributes over the configured ones, drawing it and again on each
	// update, so a class of its own replaced the checkbox-beside-text layout. Merge them as saving
	// does, and redraw the item when anything but the tick changes (a removed id or style goes too).
	// Ticks and typing update in place, keeping the class as drawn: the layout's and the selection's.
	addNodeView() {
		const create = this.parent?.()
		return (props) => {
			const view = create!(props)
			const dom = view.dom as HTMLElement
			const attributes = mergeAttributes(this.options.HTMLAttributes, props.HTMLAttributes)
			for (const [name, value] of Object.entries(attributes)) dom.setAttribute(name, value)
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
