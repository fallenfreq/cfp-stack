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
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

function parseSelector(selector: string): {
  tag: string
  requiredAttribute?: string
  value?: string
} {
  // Match the tag name and optional attribute selector
  const match = selector.match(/^(?<tag>\w+)(?:\[(?<attribute>[^\]=]+)(?:=(?<value>[^\]]+))?\])?$/)

  if (!match || !match.groups) {
    throw new Error(`Invalid selector: ${selector}`)
  }

  const { tag, attribute, value } = match.groups

  return {
    tag,
    requiredAttribute: attribute,
    value: value ? value.replace(/^['"]|['"]$/g, '') : undefined // Remove quotes from value
  }
}

// Function to build dynamic nodes based on editor schema
function createNodesFromSchema(editor: Editor) {
  const nodes = editor.schema.nodes
  // exclude nodes from the starter kit to prevent dynamic nodes from being created
  // The dynamic nodes render vue compnents as their tags and strip default attributes
  // This keeps the code view clean and easier to work with
  const exludeNodes = [
    'blockquote',
    'bulletList',
    'codeBlock',
    'hardBreak',
    'heading',
    'horizontalRule',
    'listItem',
    'orderedList',
    'paragraph',
    'text',
    'youtube',
    'image',
    'doc'
  ]
  return Object.keys(nodes)
    .filter((nodeName) => !exludeNodes.includes(nodeName))
    .map((nodeName) => {
      const nodeType: NodeType = nodes[nodeName]
      const selector = nodeType.spec.parseDOM?.[0]?.tag || nodeName
      const { tag, requiredAttribute, value } = parseSelector(selector)

      // Create a mock Node instance with minimal attributes and content
      const mockAttributes = Object.keys(nodeType.spec.attrs || {}).reduce(
        (attrs, attrName) => {
          if (requiredAttribute) {
            attrs[requiredAttribute] = value || ''
          }
          attrs[attrName] = nodeType.spec.attrs?.[attrName].default || null
          return attrs
        },
        {} as Record<string, any>
      )

      const mockNode: Node | null = nodeType.createAndFill(mockAttributes)
      const domOutput = mockNode ? nodeType.spec.toDOM?.(mockNode) : null

      // We are using some but I think the array should be the last item if complex
      // The complex check and final tag is redundant right now since complex nodes are being rendered by their default extension
      const isComplexStructure =
        Array.isArray(domOutput) && domOutput.some((item) => Array.isArray(item))

      const finalTag = isComplexStructure ? nodeName : tag

      const { attrs = {}, ...restOfSpec } = nodeType.spec

      // Dynamically build the Node configuration using the spec
      const nodeConfig: NodeConfig = {
        name: nodeName,
        ...restOfSpec,
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
            if (HTMLAttributes[attr] !== defaultValue || attr === requiredAttribute) {
              attrsToRender[attr] = HTMLAttributes[attr]
            }
          })
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
      Image,
      Youtube.extend({
        renderHTML({ node, HTMLAttributes }) {
          const attrs = (node.type.spec.attrs ??= {})
          const filteredAttributes = Object.keys(attrs).reduce(
            (acc, key) => {
              if (HTMLAttributes[key] !== attrs[key].default) {
                acc[key] = HTMLAttributes[key]
              }
              return acc
            },
            {} as Partial<typeof node.type.spec.attrs>
          )
          const domOutputSpec = this.parent?.({ node, HTMLAttributes })

          if (domOutputSpec && Array.isArray(domOutputSpec) && domOutputSpec[2]?.[1]) {
            domOutputSpec[2][1] = filteredAttributes
          } else throw new Error('No parent DomOutputSpec or unexpected format')

          return domOutputSpec
        },
        addAttributes() {
          const existingAttributes = this.parent?.() || {}
          return {
            ...existingAttributes,
            resp: {
              default: '',
              parseHTML: (element) => element.getAttribute('resp'),
              renderHTML: (attributes) => ({ resp: attributes.resp })
            }
          }
        }
      }),
      CodeBlockLowlight,
      AllowAttributesExtension
    ])
  }
}

export { initGenerateDynamicHTML }
