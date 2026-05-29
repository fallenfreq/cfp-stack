import ToolbarButton from '@/components/editor/toolbar/ToolbarButton.vue'
import type { Editor } from '@tiptap/vue-3'
import type { Component, VNodeChild } from 'vue'
import { defineComponent, h } from 'vue'
import type { ToolbarItem, ToolbarItemContext } from './types'

interface ButtonItemOptions {
	id: string
	/** String label or render function returning icon/VNode content. */
	label: string | (() => VNodeChild)
	show: (editor: Editor, context: ToolbarItemContext) => boolean
	active?: (editor: Editor, context: ToolbarItemContext) => boolean
	disabled?: (editor: Editor, context: ToolbarItemContext) => boolean
	action: (editor: Editor, context: ToolbarItemContext) => void
}

export function toolbarCustomItem(
	id: string,
	show: (editor: Editor, context: ToolbarItemContext) => boolean,
	component: Component,
	extraProps?: Record<string, unknown>,
): ToolbarItem {
	if (!extraProps) return { id, show, component }
	return {
		id,
		show,
		component: defineComponent({
			props: ['editor', 'context'],
			setup(props: { editor: Editor; context: ToolbarItemContext }) {
				return () =>
					h(component, { editor: props.editor, context: props.context, ...extraProps })
			},
		}),
	}
}

export function toolbarButtonItem(options: ButtonItemOptions): ToolbarItem {
	return {
		id: options.id,
		show: options.show,
		component: defineComponent({
			props: ['editor', 'context'],
			setup(props: { editor: Editor; context: ToolbarItemContext }) {
				return () =>
					h(
						ToolbarButton,
						{
							active: options.active?.(props.editor, props.context) ?? false,
							disabled: options.disabled?.(props.editor, props.context) ?? false,
							onClick: () => options.action(props.editor, props.context),
						},
						typeof options.label === 'string' ? () => options.label : options.label,
					)
			},
		}),
	}
}
