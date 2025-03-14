import {
  generateHTML,
  Node as TiptapNode,
  type JSONContent,
  type Editor,
  type NodeConfig
} from '@tiptap/vue-3'
import { type NodeType } from '@tiptap/pm/model'
import { AllowAttributesExtension } from '@/editor/extensions/allowAttributesExtension'
import Youtube from '@tiptap/extension-youtube'
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Heading from '@tiptap/extension-heading'
import TaskItem from '@tiptap/extension-task-item'
// import TaskList from '@tiptap/extension-task-list'

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
  // The dynamic nodes render vue components as their tags and strip default attributes
  // This keeps the code view clean and easier to work with
  const excludeNodes = [
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
    'doc',
    // 'taskList',
    'taskItem'
  ]
  return Object.keys(nodes)
    .filter((nodeName) => !excludeNodes.includes(nodeName))
    .map((nodeName) => {
      const nodeType: NodeType = nodes[nodeName]
      const selector = nodeType.spec.parseDOM?.[0]?.tag || nodeName
      const { tag, requiredAttribute, value } = parseSelector(selector)
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
            requiredAttribute
              ? { [requiredAttribute]: { default: value } }
              : ({} as Record<string, { default: any }>)
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
          return nodeType.isLeaf ? [tag, attrsToRender] : [tag, attrsToRender, 0]
        }
      }

      return TiptapNode.create(nodeConfig)
    })
}

// Function to generate HTML from the JSON with dynamic nodes
function initGenerateBlueprintHTML(editor: Editor) {
  const dynamicNodes = createNodesFromSchema(editor)

  return (json?: JSONContent) => {
    return generateHTML(json || editor.getJSON(), [
      StarterKit.configure({
        codeBlock: false,
        heading: false
      }),
      Heading,
      Image,
      // TaskItem converts data-checked to checked so we can not access the data attribute
      // using our generic implementation that is used above for nodeViews and a few other extensions
      TaskItem.extend({
        renderHTML({ node, HTMLAttributes }) {
          const selector = node.type.spec.parseDOM?.[0]?.tag || node.type.name
          const { tag, requiredAttribute, value } = parseSelector(selector)
          return [
            tag,
            { ...HTMLAttributes, ...(requiredAttribute ? { [requiredAttribute]: value } : {}) },
            0
          ]
        }
      }),
      // TaskList,
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
      AllowAttributesExtension,
      ...dynamicNodes
    ])
  }
}

export { initGenerateBlueprintHTML }
