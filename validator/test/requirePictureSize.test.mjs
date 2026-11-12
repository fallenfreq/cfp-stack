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

test('a component block with no layout framing a picture is a result saying why', () => {
	const page = `<layout-card class="sl-aspect-16-9 sl-object-cover">
	<img src="a.png" />
</layout-card>
<layout-card class="sl-aspect-16-9 sl-object-cover"><img src="a.png" /><p>Beside it</p></layout-card>`
	assert.deepEqual(checkHtml(requirePictureSize, page), [
		{
			message:
				"This block's shape and fill don't reach its picture: give the block a layout such as sl-stack, or put the shape and fill on the picture",
			lines: [2],
		},
		{ message: jumps, lines: [4] },
	])
})

// Each measured in the editor (Chrome): the box kept its shape with a square picture in it.
test('its width and height, a shape with a fill, or a frame it covers is a size', () => {
	const page = `<img src="a.png" width="800" height="600" />
<img src="a.png" class="sl-aspect-4-3 sl-object-contain" />
<div class="sl-aspect-16-9 sl-object-cover"><img src="a.png" /></div>
<div class="sl-stack sl-aspect-16-9 sl-object-cover">
	<img src="a.png" />
</div>
<blockquote class="sl-aspect-16-9 sl-object-cover"><img src="a.png" /></blockquote>
<layout-card class="sl-stack sl-aspect-16-9 sl-object-cover"><img src="a.png" /></layout-card>
<layout-card class="sl-cluster sl-aspect-16-9 sl-object-cover"><img src="a.png" /></layout-card>
<layout-stack class="sl-stack sl-aspect-16-9 sl-object-cover"><img src="a.png" /></layout-stack>
<layout-center class="sl-center sl-stack sl-aspect-16-9 sl-object-cover"><img src="a.png" /></layout-center>`
	assert.deepEqual(checkHtml(requirePictureSize, page), [])
})

test('each shape and each fill in the spec counts', () => {
	for (const shape of ['sl-aspect-1-1', 'sl-aspect-16-9', 'sl-aspect-4-3', 'sl-aspect-9-16'])
		for (const fill of ['sl-object-cover', 'sl-object-contain', 'sl-object-fill']) {
			const page = `<img class="${shape} ${fill}" /><div class="${shape} ${fill}"><img /></div>`
			assert.deepEqual(checkHtml(requirePictureSize, page), [], `${shape} ${fill}`)
		}
})
