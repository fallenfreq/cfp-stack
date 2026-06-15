import Youtube from '@tiptap/extension-youtube'

export const YoutubeExtension = Youtube.extend({
	renderHTML({ node, HTMLAttributes }) {
		const { resp } = node.attrs
		const maxWidthStyle = resp ? `max-width: ${resp};` : null
		const domOutputSpec = this.parent?.({ node, HTMLAttributes })
		if (!domOutputSpec) throw new Error('No parent DomOutputSpec found')
		return resp === '' || resp
			? ['div', { class: 'max-w-xl', style: maxWidthStyle }, domOutputSpec]
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
								class: (attributes.class || '' + ' resp-yt').trim(),
							}
						: {}
				},
			},
		}
	},
})
