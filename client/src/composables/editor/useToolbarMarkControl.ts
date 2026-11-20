import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { LookSetting } from '@somefreq-app/shared/textLooks'
import { TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref, watch } from 'vue'
import { useToolbarNodeControl } from './useToolbarNodeControl'

export function useToolbarMarkControl(props: { editor: Editor; context: ToolbarItemContext }) {
	const node = useToolbarNodeControl(props)
	// The text the looks go on, saved on opening; cleared whenever the panel closes.
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

	// A pick's looks, on the text the panel opened for, which stays selected.
	const commitLooks = (looks: Partial<Record<LookSetting, string | null>>) => {
		const range = savedRange.value
		if (!range) return
		props.editor.chain().setTextLooks(range.from, range.to, looks).setTextSelection(range).run()
	}

	return { ...node, mode, setOpen, commitLooks }
}
