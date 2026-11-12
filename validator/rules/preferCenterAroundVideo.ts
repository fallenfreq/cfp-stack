import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

export const preferCenterAroundVideo: ElementRule = {
	name: 'prefer-center-around-video',
	type: 'suggestion',
	check(tree, report) {
		visit(tree, 'element', (element) => {
			// A video is an iframe marked as one (data-youtube-video), the mark its default size reads.
			if (
				element.tagName === 'iframe'
				&& element.properties['dataYoutubeVideo'] !== undefined
				&& (element.properties.className ?? []).includes('sl-center')
			)
				report({
					message:
						"A video is usually centred by an sl-center around it, with max-width: none in the video's own style",
					nodes: [element],
				})
		})
	},
}
