import ToolbarButton from '@/components/editor/toolbar/ToolbarButton.vue'
import type { Editor } from '@tiptap/vue-3'
import { defineComponent, h } from 'vue'
import type { ToolbarItem } from './types'

interface ButtonItemOptions {
	id: string
	label: string
	show: (editor: Editor) => boolean
	active?: (editor: Editor) => boolean
	action: (editor: Editor) => void
}

export function toolbarButtonItem(options: ButtonItemOptions): ToolbarItem {
	return {
		id: options.id,
		show: options.show,
		component: defineComponent({
			props: ['editor'],
			setup(props: { editor: Editor }) {
				return () =>
					h(
						ToolbarButton,
						{
							active: options.active?.(props.editor) ?? false,
							onClick: () => options.action(props.editor),
						},
						() => options.label,
					)
			},
		}),
	}
}
