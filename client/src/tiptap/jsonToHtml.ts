import {
  generateHTML,
  Node as TiptapNode,
  type JSONContent,
  type Editor,
  type NodeConfig
} from '@tiptap/vue-3'
import { type NodeType, Node } from '@tiptap/pm/model'
import { AllowAttributesExtension } from './allowAttributesExtension'
import Youtube from '@tiptap/extension-youtube'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

// Function to build dynamic nodes based on editor schema
function createNodesFromSchema(editor: Editor) {
  const nodes = editor.schema.nodes
  // console.log(nodes)
  // exclude nodes from the starter kit to prevent dynamic nodes from being created
  // The dynamic nodes render vue compnents as their tags and strip default attributes
  // This keeps the code view clean and easier to work with
  const exludeNodes = [
    'blockquote',
    'bulletList',
    'codeBlock',
    'document',
    'hardBreak',
    'heading',
    'horizontalRule',
    'listItem',
    'orderedList',
    'paragraph',
    'text',
    'doc',
    'youtube'
  ]
  return Object.keys(nodes)
    .filter((nodeName) => !exludeNodes.includes(nodeName))
    .map((nodeName) => {
      const nodeType: NodeType = nodes[nodeName]
      const tag = nodeType.spec.parseDOM?.[0]?.tag || nodeName

      // Create a mock Node instance with minimal attributes and content
      const mockAttributes = Object.keys(nodeType.spec.attrs || {}).reduce(
        (attrs, attrName) => {
          attrs[attrName] = nodeType.spec.attrs?.[attrName].default || null
          // toDOM will crash if src is null for youtube mock node
          if (attrName === 'src' && nodeType.name === 'youtube' && attrs[attrName] === null) {
            attrs[attrName] = 'https://www.youtube.com/embed/3lTUAWOgoHs'
          }
          return attrs
        },
        {} as Record<string, any>
      )

      const mockNode: Node | null = nodeType.createAndFill(mockAttributes)
      const domOutput = mockNode ? nodeType.spec.toDOM?.(mockNode) : null

      // console.log({ nodeName, domOutput, mockAttributes })

      // We are using some but I think the array should be the last item if complex
      // The compex check and final tag is redundant right now since compex nodes are being rendered by their default extension
      const isComplexStructure =
        Array.isArray(domOutput) && domOutput.some((item) => Array.isArray(item))

      const finalTag = isComplexStructure ? nodeName : tag

      const { attrs = {}, ...restOfSpect } = nodeType.spec

      // Dynamically build the Node configuration using the spec
      const nodeConfig: NodeConfig = {
        name: nodeName,
        ...restOfSpect,
        atom: nodeType.isAtom,

        // Dynamically add attributes based on spec.attrs
        addAttributes() {
          const attributes = Object.keys(attrs).reduce(
            (acc, attr) => {
              return {
                ...acc,
                [attr]: { default: attrs[attr]?.default }
              }
            },
            {} as Record<string, { default: any }>
          )
          return attributes
        },

        renderHTML({ HTMLAttributes }) {
          // Filter out attributes that match their default values
          const attrsToRender: Record<string, any> = {}
          Object.keys(HTMLAttributes).forEach((attr) => {
            const defaultValue = attrs[attr]?.default
            if (HTMLAttributes[attr] !== defaultValue) {
              attrsToRender[attr] = HTMLAttributes[attr]
            }
          })
          // console.log({ nodeName, HTMLAttributes })
          return nodeType.isLeaf ? [finalTag, attrsToRender] : [finalTag, attrsToRender, 0]
        }
      }

      return TiptapNode.create(nodeConfig)
    })
}

// Function to generate HTML from the JSON with dynamic nodes
function initGenerateDynamicHTML(editor: Editor) {
  const dynamicNodes = createNodesFromSchema(editor)
  return (json?: JSONContent) => {
    return generateHTML(json || editor.getJSON(), [
      StarterKit.configure({
        codeBlock: false
      }),
      ...dynamicNodes,
      Youtube,
      CodeBlockLowlight,
      AllowAttributesExtension
    ])
  }
}

export { initGenerateDynamicHTML }
