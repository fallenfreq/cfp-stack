import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { NodePos } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { nextTick, ref, watch } from 'vue'

export function useToolbarNodeControl(props: { editor: Editor; context: ToolbarItemContext }) {
	const open = ref(false)
	const buttonEl = ref<HTMLElement | null>(null)
	const capturedPos = ref<NodePos | null>(null)

	const toggle = () => {
		if (open.value) {
			onClose()
			return
		}
		capturedPos.value = props.context.nodePos
		open.value = true
	}

	const onClose = () => {
		open.value = false
		nextTick(() => {
			capturedPos.value = null
		})
	}

	watch(
		() => props.context.nodePos,
		(nodePos) => {
			if (!open.value || capturedPos.value === null) return
			if (nodePos !== capturedPos.value) onClose()
		},
	)

	return { open, buttonEl, capturedPos, toggle, onClose }
}
