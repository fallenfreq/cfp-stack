import AppTooltip from '@/components/AppTooltip.vue'
import ToolbarButton from '@/components/editor/toolbar/ToolbarButton.vue'
import type { Editor } from '@tiptap/vue-3'
import type { Component, VNodeChild } from 'vue'
import { defineComponent, h } from 'vue'
import type { ToolbarItem, ToolbarItemContext } from './types'

const withTooltip = (node: VNodeChild, tooltip?: string): VNodeChild =>
	tooltip ? h(AppTooltip, { text: tooltip, placement: 'top' }, () => node) : node

function toolbarItem(
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

type ButtonItemBase = {
	id: string
	show: (editor: Editor, context: ToolbarItemContext) => boolean
	active?: (editor: Editor, context: ToolbarItemContext) => boolean
	disabled?: (editor: Editor, context: ToolbarItemContext) => boolean
	action: (editor: Editor, context: ToolbarItemContext) => void
}

/** Icon-only button — tooltip is required so it can never be accidentally omitted. */
type IconButtonItem = ButtonItemBase & {
	label: () => VNodeChild
	tooltip: string
}

/** Text-label button — self-descriptive, no tooltip needed. */
type TextButtonItem = ButtonItemBase & {
	label: string
}

type ButtonItemOptions = IconButtonItem | TextButtonItem

interface CustomItemOptions {
	props?: Record<string, unknown>
	tooltip?: string
}

export function toolbarCustomItem(
	id: string,
	show: (editor: Editor, context: ToolbarItemContext) => boolean,
	component: Component,
	options?: CustomItemOptions,
): ToolbarItem {
	return toolbarItem(id, show, (editor, context) => {
		const inner = h(component, { editor, context, ...options?.props })
		return withTooltip(inner, options?.tooltip)
	})
}

export function toolbarButtonItem(options: ButtonItemOptions): ToolbarItem {
	return toolbarItem(options.id, options.show, (editor, context) => {
		const isIcon = typeof options.label !== 'string'
		const btn = h(
			ToolbarButton,
			{
				active: options.active?.(editor, context) ?? false,
				disabled: options.disabled?.(editor, context) ?? false,
				onClick: () => options.action(editor, context),
			},
			isIcon ? options.label : () => options.label,
		)
		return withTooltip(btn, isIcon ? (options as IconButtonItem).tooltip : undefined)
	})
}
