import type { NodePos } from '@/utils/editor/editorUtils'
import type { Node } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/vue-3'
import type { Component } from 'vue'

export type { NodePos }

export interface ToolbarItemContext {
	activeNode: Node
	activeDepth: number
	nodePos: NodePos | null
}

export interface ToolbarItem {
	id: string
	show: (editor: Editor, context: ToolbarItemContext) => boolean
	component: Component
}

export interface FloatingToolbarOptions {
	items: ToolbarItem[]
}
