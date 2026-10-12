import ToolbarButton from '@/components/editor/toolbar/ToolbarButton.vue'
import type { Editor } from '@tiptap/vue-3'
import type { Component, VNodeChild } from 'vue'
import { defineComponent, h } from 'vue'
import type { ToolbarItem, ToolbarItemContext } from './types'

// An item that draws what it likes; a button is one of the kinds below.
export function toolbarItem(
	id: string,
	show: (editor: Editor, context: ToolbarItemContext) => boolean,
	render: (editor: Editor, context: ToolbarItemContext) => VNodeChild,
): ToolbarItem {
	return {
		id,
		show,
		component: defineComponent({
			props: ['editor', 'context'],
			setup(props: { editor: Editor; context: ToolbarItemContext }) {
				return () => render(props.editor, props.context)
			},
		}),
	}
}

interface ButtonItemBase {
	id: string
	show: (editor: Editor, context: ToolbarItemContext) => boolean
	active?: (editor: Editor, context: ToolbarItemContext) => boolean
	disabled?: (editor: Editor, context: ToolbarItemContext) => boolean
	action: (editor: Editor, context: ToolbarItemContext) => void
	// Shows on hover; a button without words is named by it too.
	tooltip: string
}

/** An icon button. */
type IconButtonItem = ButtonItemBase & {
	label: (editor: Editor, context: ToolbarItemContext) => VNodeChild
}

/** A button with words, which are its name. */
type TextButtonItem = ButtonItemBase & {
	label: string
}

type ButtonItemOptions = IconButtonItem | TextButtonItem

interface CustomItemOptions {
	props?: Record<string, unknown>
	tooltip: string
}

// The component draws its own button, so the tooltip goes to it as its `tooltip` prop.
export function toolbarCustomItem(
	id: string,
	show: (editor: Editor, context: ToolbarItemContext) => boolean,
	component: Component,
	options: CustomItemOptions,
): ToolbarItem {
	return toolbarItem(id, show, (editor, context) =>
		h(component, { editor, context, tooltip: options.tooltip, ...options.props }),
	)
}

function isIconItem(o: ButtonItemOptions): o is IconButtonItem {
	return typeof o.label !== 'string'
}

export function toolbarButtonItem(options: ButtonItemOptions): ToolbarItem {
	return toolbarItem(options.id, options.show, (editor, context) => {
		const props = {
			tooltip: options.tooltip,
			current: options.active?.(editor, context) ?? false,
			disabled: options.disabled?.(editor, context) ?? false,
			onClick: () => options.action(editor, context),
		}
		return isIconItem(options)
			? h(ToolbarButton, props, () => options.label(editor, context))
			: h(ToolbarButton, { ...props, label: options.label })
	})
}
