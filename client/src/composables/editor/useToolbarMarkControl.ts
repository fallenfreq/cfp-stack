import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { NodePos } from '@/utils/editor/editorUtils'
import { TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, nextTick, ref, watch } from 'vue'

export function useToolbarMarkControl(props: { editor: Editor; context: ToolbarItemContext }) {
	const open = ref(false)
	const buttonEl = ref<HTMLElement | null>(null)
	const capturedPos = ref<NodePos | null>(null)
	const savedRange = ref<{ from: number; to: number } | null>(null)

	// Mark mode: text range selected in an inline-content non-codeBlock.
	// Node mode: block node active, no qualifying text selection.
	// Touch props.context so Vue re-runs this on every toolbar tick (transactions).
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
		open.value = false
		nextTick(() => {
			capturedPos.value = null
			savedRange.value = null
		})
	}

	// Remove the named mark from the saved range, then re-add it with attrs if provided.
	// Pass attrs=null to clear the mark entirely.
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

	watch(
		() => props.context.nodePos,
		(nodePos) => {
			if (!open.value || capturedPos.value === null) return
			if (nodePos !== capturedPos.value) onClose()
		},
	)

	return { open, buttonEl, capturedPos, mode, toggle, onClose, commitMark }
}
