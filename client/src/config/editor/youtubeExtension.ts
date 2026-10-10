import Youtube from '@tiptap/extension-youtube'

// A video is one box, as an image is: its iframe, wearing the node's classes, id and style. Its
// size is the stylesheet's video default (api/src/domain/css/embeds.ts) unless an sl-aspect-*
// choice or its own style says otherwise.
export const YoutubeExtension = Youtube.extend({
	// TipTap's own shape, its box holding the iframe, reads too.
	parseHTML() {
		return [
			{ tag: 'iframe[data-youtube-video]' },
			...(this.parent?.() ?? []),
			{ tag: 'div[data-youtube-video]', skip: true },
		]
	},
	// TipTap writes its box holding the iframe; only the iframe is written, without TipTap's fixed
	// size, marked as a video.
	renderHTML({ node, HTMLAttributes }) {
		const spec = this.parent?.({ node, HTMLAttributes })
		if (!Array.isArray(spec) || !Array.isArray(spec[2]))
			throw new Error("TipTap's video is no longer a box holding an iframe")
		const iframe: Record<string, unknown> = { ...spec[2][1] }
		delete iframe.width
		delete iframe.height
		return ['iframe', { ...iframe, 'data-youtube-video': '' }]
	},
	// Nor is TipTap's fixed size a setting of the video's.
	addAttributes() {
		return Object.fromEntries(
			Object.entries(this.parent?.() ?? {}).filter(
				([name]) => name !== 'width' && name !== 'height',
			),
		)
	},
})
