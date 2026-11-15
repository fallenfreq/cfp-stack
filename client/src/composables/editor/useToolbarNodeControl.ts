import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { NodePos } from '@/utils/editor/editorUtils'
import { getStyleProp, setStyleProp } from '@/utils/editor/styleString'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref, watch } from 'vue'

const names = (classes: string) => new Set(classes.split(/\s+/).filter(Boolean))
const sameNames = (a: string, b: string) => {
	const [x, y] = [names(a), names(b)]
	return x.size === y.size && [...x].every((name) => y.has(name))
}

export function useToolbarNodeControl(props: { editor: Editor; context: ToolbarItemContext }) {
	const open = ref(false)
	const capturedPos = ref<NodePos | null>(null)

	// The panel reports opening and closing; opening remembers which node it's for.
	const setOpen = (value: boolean) => {
		if (value === open.value) return
		if (!value) {
			onClose()
			return
		}
		capturedPos.value = props.context.nodePos
		open.value = true
	}

	const onClose = () => {
		open.value = false
		capturedPos.value = null
	}

	watch(
		() => props.context.nodePos,
		(nodePos) => {
			if (!open.value || capturedPos.value === null) return
			if (nodePos !== capturedPos.value) onClose()
		},
	)

	// A panel's block is the toolbar's: it follows each change.
	const blockPos = computed(() => props.context.nodePos)
	const block = computed(() => props.context.activeNode)
	const blockClass = computed<string>(() => block.value.attrs['class'] ?? '')
	const blockStyle = computed<string>(() => block.value.attrs['style'] ?? '')

	// So a pick that changes nothing writes nothing: the same class names in another order are the
	// same class, and no style is written as none (null, its default), as reading gives ''.
	const updateBlockAttributes = (attributes: Record<string, unknown>) => {
		if (blockPos.value === null) return false
		const picked = attributes['class']
		return props.editor.commands.updateAttributesAt(blockPos.value, {
			...attributes,
			...(typeof picked === 'string'
				&& sameNames(picked, blockClass.value) && { class: blockClass.value }),
			...(attributes['style'] === '' && { style: null }),
		})
	}

	// A panel's pick: the classes starting with each prefix in `replacing` give way to `classes`,
	// and each style property is set (null takes it off). The style is written only when one of
	// them changes, as writing it can reformat what the author wrote.
	const updateBlockLook = (look: {
		replacing: string[]
		classes: string[]
		style?: Record<string, string | null>
	}) => {
		const kept = blockClass.value
			.split(/\s+/)
			.filter((c) => c && !look.replacing.some((prefix) => c.startsWith(prefix)))
		const changes = Object.entries(look.style ?? {}).filter(
			([property, value]) => getStyleProp(blockStyle.value, property) !== (value ?? ''),
		)
		return updateBlockAttributes({
			class: [...kept, ...look.classes].join(' '),
			...(changes.length > 0 && {
				style: changes.reduce(
					(s, [property, value]) => setStyleProp(s, property, value),
					blockStyle.value,
				),
			}),
		})
	}

	return {
		open,
		setOpen,
		blockPos,
		block,
		blockClass,
		blockStyle,
		updateBlockAttributes,
		updateBlockLook,
	}
}
