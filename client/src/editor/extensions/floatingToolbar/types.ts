import type { Editor } from '@tiptap/vue-3'
import type { Component } from 'vue'

export interface ToolbarItem {
	id: string
	show: (editor: Editor) => boolean
	component: Component
}

export interface FloatingToolbarOptions {
	items: ToolbarItem[]
}
