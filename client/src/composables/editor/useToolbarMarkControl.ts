import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref, watch } from 'vue'
import { useToolbarNodeControl } from './useToolbarNodeControl'

export function useToolbarMarkControl(props: { editor: Editor; context: ToolbarItemContext }) {
	const node = useToolbarNodeControl(props)
	// The text the marks go on, saved on opening; cleared whenever the panel closes.
	const savedRange = ref<{ from: number; to: number } | null>(null)
	watch(node.open, (isOpen) => {
		if (!isOpen) savedRange.value = null
	})

	const mode = computed<'mark' | 'node'>(() => {
		void props.context
		const sel = props.editor.state.selection
		if (
			sel instanceof TextSelection
			&& sel.from !== sel.to
			&& sel.$from.parent.type.inlineContent
			&& sel.$from.parent.type.name !== 'codeBlock'
		)
			return 'mark'
		return 'node'
	})

	const setOpen = (value: boolean) => {
		if (value && !node.open.value) {
			const { from, to } = props.editor.state.selection
			savedRange.value = { from, to }
		}
		node.setOpen(value)
	}

	const commitMark = (markName: string, attrs: Record<string, unknown> | null) => {
		const range = savedRange.value
		if (!range) return
		const markType = props.editor.schema.marks[markName]
		if (!markType) return
		const { from, to } = range
		let tr = props.editor.state.tr.removeMark(from, to, markType)
		if (attrs !== null) tr = tr.addMark(from, to, markType.create(attrs))
		tr = tr.setSelection(TextSelection.create(tr.doc, from, to))
		props.editor.view.dispatch(tr)
	}

	return { ...node, mode, setOpen, commitMark }
}
