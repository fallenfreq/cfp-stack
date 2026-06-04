import { editorComponents, RADIUS_OPTIONS } from '@/config/editor/editorComponents'
import { dataAttr } from '@/editor/enumAttr'
import { Extension } from '@tiptap/vue-3'
const componentNodeTypes = Object.keys(editorComponents)

// List the nodes that you want to extend with global attributes support
const nodesWithStyle = [
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
	// custom nodes
	'span',
	'div',
	// extra imported nodes
	'youtube',
	'image',
	'table',
	'tableCell',
	'tableHeader',
	'tableRow',
	'taskItem',
	'taskList',
]

const AllowAttributesExtension = Extension.create({
	addGlobalAttributes() {
		return [
			{
				types: [...nodesWithStyle, ...componentNodeTypes],
				attributes: {
					style: {
						default: null,
						// The values returned from parseHTML will be passed to renderHTML
						parseHTML: (element) => element.getAttribute('style'),
						renderHTML: (attributes) => {
							return attributes.style ? { style: attributes.style } : null
						},
					},
					class: {
						default: '',
						parseHTML: (element) => element.classList.value,
						renderHTML: (attributes) => {
							return attributes.class ? { class: attributes.class } : null
						},
					},
					id: {
						default: null,
						parseHTML: (element) => element.getAttribute('id'),
						renderHTML: (attributes) => {
							return attributes.id ? { id: attributes.id } : null
						},
					},
				},
			},
			// Per-node `radius` lives here so img + codeBlock share one declaration
			// (different sensible defaults) and the attribute panel auto-surfaces a
			// dropdown via `extensionManager.attributes`. LayoutCard's existing
			// `radius` Vue prop is parallel and uses the same RADIUS_OPTIONS list.
			{
				types: ['image'],
				attributes: { radius: dataAttr('radius', 'none', RADIUS_OPTIONS) },
			},
			{
				types: ['codeBlock'],
				attributes: { radius: dataAttr('radius', 'md', RADIUS_OPTIONS) },
			},
		]
	},
})

export { AllowAttributesExtension }
