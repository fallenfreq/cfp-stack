// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { preferCenterAroundVideo } from '../rules/preferCenterAroundVideo.ts'
import { checkHtml } from './checkHtml.mjs'

test('a centred video is a suggestion', () => {
	const page = `<iframe data-youtube-video class="sl-center" src="https://www.youtube.com/embed/a"></iframe>`
	const results = checkHtml(preferCenterAroundVideo, page)
	assert.deepEqual(results, [
		{
			message:
				"A video is usually centred by a Centre around it, with max-width: none in the video's own style",
			lines: [1],
		},
	])
	assert.equal(preferCenterAroundVideo.type, 'suggestion')
})

test("a video in a Centre, or a centred frame that isn't a video, is no result", () => {
	const page = `<div class="sl-center sl-stack">
	<iframe data-youtube-video style="max-width: none" src="https://www.youtube.com/embed/a"></iframe>
</div>
<iframe class="sl-center" src="https://example.com"></iframe>
<iframe data-youtube-video class="sl-bleed" src="https://www.youtube.com/embed/a"></iframe>`
	assert.deepEqual(checkHtml(preferCenterAroundVideo, page), [])
})
