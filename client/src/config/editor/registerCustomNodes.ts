import { editorComponents } from '@/config/editor/editorComponents'
import { createVueNode } from '@/editor/extensions/customComponentNode'

export function registerCustomNodes() {
	const customNodes: ReturnType<typeof createVueNode>[] = []

	for (const componentData of Object.values(editorComponents)) {
		customNodes.push(createVueNode(componentData))
	}

	return customNodes
}
