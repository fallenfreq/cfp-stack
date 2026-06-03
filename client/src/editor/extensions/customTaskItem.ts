import { TaskItem } from '@tiptap/extension-list'

// Mobile drag-select that crosses a selectable:true block converts to a
// NodeSelection — native touch handles vanish and the synthetic click on the
// checkbox toggles it.  dragHandle.ts spans the node with a TextSelection for
// selectable:false nodes so the gutter handle still drags task items.
export const CustomTaskItem = TaskItem.extend({
	selectable: false,
})
