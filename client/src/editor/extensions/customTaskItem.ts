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

	// TipTap's item sets its own attributes over the configured ones, so a class of its own
	// replaced the checkbox-beside-text layout, and it updates only the tick. Merge them as saving
	// does, and redraw the item when anything else changes, so it's built from its new attributes
	// as it was at first (a removed id or style goes too). Ticking still updates in place.
	addNodeView() {
		const create = this.parent?.()
		return (props) => {
			const view = create!(props)
			const attributes = mergeAttributes(this.options.HTMLAttributes, props.HTMLAttributes)
			for (const [name, value] of Object.entries(attributes))
				(view.dom as HTMLElement).setAttribute(name, value)
			let shown = props.node
			const onlyTicked = (node: PMNode) =>
				node.type === shown.type
				&& Object.keys(node.attrs).every(
					(name) => name === 'checked' || node.attrs[name] === shown.attrs[name],
				)
			return {
				...view,
				update: (node, decorations, innerDecorations) => {
					if (!onlyTicked(node) || !view.update?.(node, decorations, innerDecorations))
						return false
					shown = node
					return true
				},
			}
		}
	},
})
