// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requirePictureSize } from '../rules/requirePictureSize.ts'
import { checkHtml } from './checkHtml.mjs'

const jumps =
	'The page jumps when this picture loads: give it its width and height, or a shape with a fill'

test('a picture with no size of its own is a result', () => {
	const page = `<img src="a.png" />
<img src="a.png" width="800" />
<img src="a.png" width="100%" height="auto" />
<img src="a.png" class="sl-aspect-16-9" />
<img src="a.png" class="sl-object-cover" />
<img src="a.png" class="sl-aspect-16-9 sl-object-none" />
<div class="sl-aspect-16-9 sl-object-cover">
	<img src="a.png" />
	<p>Beside it</p>
</div>
<div class="sl-aspect-16-9"><img src="a.png" /></div>
<div class="sl-aspect-16-9 sl-object-cover"><div><img src="a.png" /></div></div>`
	assert.deepEqual(
		checkHtml(requirePictureSize, page),
		[1, 2, 3, 4, 5, 6, 8, 11, 12].map((line) => ({ message: jumps, lines: [line] })),
	)
})

test('its width and height, a shape with a fill, or a frame it covers is a size', () => {
	const page = `<img src="a.png" width="800" height="600" />
<img src="a.png" class="sl-aspect-4-3 sl-object-contain" />
<div class="sl-stack sl-aspect-16-9 sl-object-cover">
	<img src="a.png" />
</div>`
	assert.deepEqual(checkHtml(requirePictureSize, page), [])
})

test('each shape and each fill in the spec counts', () => {
	for (const shape of ['sl-aspect-1-1', 'sl-aspect-16-9', 'sl-aspect-4-3', 'sl-aspect-9-16'])
		for (const fill of ['sl-object-cover', 'sl-object-contain', 'sl-object-fill']) {
			const page = `<img class="${shape} ${fill}" /><div class="${shape} ${fill}"><img /></div>`
			assert.deepEqual(checkHtml(requirePictureSize, page), [], `${shape} ${fill}`)
		}
})
