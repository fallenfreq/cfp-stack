import { expect, test } from './fixtures'
import { documentWidths, openSeeded, setDocumentWidth } from './helpers'

// The demo page (/editor?seed=true) laid out as last accepted, under the seed's root theme: every
// element's box, display and container type, one line per element. A change fails with the lines
// that moved; when it's intended, accept it with `pnpm test:ui --update-snapshots`. This is the
// one check that depends on the root theme's numbers, so a seed change that moves things needs
// accepting too.

for (const widthName of ['wide', 'just below sm', 'just below xs'])
	test(`the demo page is laid out as accepted, ${widthName}`, async ({ page }) => {
		await openSeeded(
			page,
			'true',
			'.tiptap.ProseMirror li:has-text("HTML source (code view) toggle")',
			null,
		)
		await setDocumentWidth(page, documentWidths().find((w) => w.name === widthName)!.px)
		const lines = await page.evaluate(() => {
			for (const el of document.querySelectorAll('*'))
				if (el.scrollTop || el.scrollLeft) el.scrollTo(0, 0)
			const doc = document.querySelector('.tiptap.ProseMirror')!
			const origin = doc.getBoundingClientRect()
			return [...doc.querySelectorAll('*')].map((el) => {
				const r = el.getBoundingClientRect()
				const style = getComputedStyle(el)
				const classes = [...el.classList].filter((c) => !c.startsWith('ProseMirror'))
				const name = el.tagName.toLowerCase() + classes.map((c) => `.${c}`).join('')
				const at = [r.left - origin.left, r.top - origin.top, r.width, r.height].map(
					Math.round,
				)
				return `${name}  ${at.join(' ')}  ${style.display} ${style.containerType}`
			})
		})
		expect(lines.join('\n') + '\n').toMatchSnapshot(
			`demo-${widthName.replaceAll(' ', '-')}.txt`,
		)
	})
