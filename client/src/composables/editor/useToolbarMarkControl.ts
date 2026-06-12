import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref } from 'vue'
import { useToolbarNodeControl } from './useToolbarNodeControl'

export function useToolbarMarkControl(props: { editor: Editor; context: ToolbarItemContext }) {
	const { open, buttonEl, capturedPos, onClose: nodeClose } = useToolbarNodeControl(props)
	// Note: we don't use nodeControl.toggle — the mark variant also captures savedRange.
	// The watcher inside nodeControl calls nodeClose (not our wrapped onClose), so
	// savedRange is not cleared on a watcher-triggered close. This is harmless since
	// commitMark is never called after the panel closes.

	const savedRange = ref<{ from: number; to: number } | null>(null)

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

	const toggle = () => {
		if (open.value) {
			onClose()
			return
		}
		const { from, to } = props.editor.state.selection
		savedRange.value = { from, to }
		capturedPos.value = props.context.nodePos
		open.value = true
	}

	const onClose = () => {
		nodeClose()
		savedRange.value = null
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

	return { open, buttonEl, capturedPos, mode, toggle, onClose, commitMark }
}
