import { createVueNode } from '@/editor/extensions/customComponentNode'
import { editorComponents } from '@/config/editor/editorComponents'

export function registerCustomNodes() {
  const customNodes: ReturnType<typeof createVueNode>[] = []

  // Loop through editorComponents and ensure the keys are typed
  for (const componentName of Object.keys(editorComponents) as (keyof typeof editorComponents)[]) {
    const componentData = editorComponents[componentName]
    customNodes.push(createVueNode(componentName, componentData))
  }

  return customNodes
}
