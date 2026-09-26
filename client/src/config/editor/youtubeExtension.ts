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
					return attributes.resp === '' || attributes.resp
						? {
								width: 'auto',
								height: 'auto',
								class: ((attributes.class || '') + ' resp-yt').trim(),
							}
						: {}
				},
			},
		}
	},
})
