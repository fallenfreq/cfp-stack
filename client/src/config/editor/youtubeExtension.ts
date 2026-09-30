import Youtube from '@tiptap/extension-youtube'

export const YoutubeExtension = Youtube.extend({
	renderHTML({ node, HTMLAttributes }) {
		const { resp } = node.attrs
		// The embed's width limit (layout): the node's own value, else 36rem.
		const maxWidthStyle = `max-width: ${resp || '36rem'};`
		const domOutputSpec = this.parent?.({ node, HTMLAttributes })
		if (!domOutputSpec) throw new Error('No parent DomOutputSpec found')
		return resp === '' || resp
			? ['div', { style: maxWidthStyle }, domOutputSpec]
			: domOutputSpec
	},
	addAttributes() {
		const existingAttributes = this.parent?.() || {}
		return {
			...existingAttributes,
			resp: {
				default: '',
				renderHTML: (attributes) => {
					// Responsive: marked for its default box (api/src/domain/css/embeds.ts), which an
					// sl-aspect-* choice or the node's own style overrides. The marker is
					// rendered each time, never stored.
					return attributes.resp === '' || attributes.resp
						? { width: 'auto', height: 'auto', 'data-responsive': '' }
						: {}
				},
			},
		}
	},
})
