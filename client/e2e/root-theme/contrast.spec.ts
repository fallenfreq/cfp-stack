import { expect, test } from '../fixtures'
import { settle, steadyRequests } from '../helpers'

// What the root theme draws on its page can be seen (sf-system.md, "Fill and ink"): a line, a
// field's edge or a focus edge reaches 3:1 on what's behind it, words 4.5:1 (WCAG 1.4.11, 1.4.3). Measured from what
// the browser draws, in light and dark, with the theme class on <html> as the app sets it.

const MODES = [
	{ name: 'light', dark: false },
	{ name: 'dark', dark: true },
]

const CASES = [
	{
		name: "a picked block's line",
		html: '<p class="sf-on-selected">Picked</p>',
		part: 'outline',
		least: 3,
	},
	{
		name: "a picked block's line with a warning",
		html: '<p class="sf-on-selected sf-is-warning">Warned</p>',
		part: 'outline',
		least: 3,
	},
	{
		name: "a picked block's line with an error",
		html: '<p class="sf-on-selected sf-is-error">Wrong</p>',
		part: 'outline',
		least: 3,
	},
	{
		name: "a field's edge at rest",
		html: '<input class="sf sf-field" />',
		part: 'edge',
		least: 3,
	},
	{
		name: "the code box's edge at rest",
		html: '<div class="sf-content-frame">code</div>',
		part: 'edge',
		least: 3,
	},
	{
		name: "a field's focus edge",
		html: '<input class="sf sf-field" />',
		part: 'focus',
		least: 3,
	},
	{
		name: 'a link in a paragraph',
		html: '<p>Read <a href="#">more</a></p>',
		part: 'link',
		least: 4.5,
	},
	{
		name: "a menu's parent item, on a page under it",
		html: '<button class="sf sf-is-contained sf-on-ancestor">Portfolio</button>',
		part: 'words',
		least: 4.5,
	},
	{
		name: 'words on a loud brand button',
		html: '<button class="sf sf-loudness-3 sf-variant-primary">Save</button>',
		part: 'words',
		least: 4.5,
	},
	{
		name: 'words on a loud warning button',
		html: '<button class="sf sf-loudness-3 sf-variant-warning">Check</button>',
		part: 'words',
		least: 4.5,
	},
] as const

for (const mode of MODES)
	test(`lines, focus edges and words can be seen on the page, ${mode.name}`, async ({ page }) => {
		await steadyRequests(page)
		await page.goto('/')
		await page.evaluate(
			(dark) => document.documentElement.classList.toggle('theme-dark', dark),
			mode.dark,
		)
		await settle(page)

		const measured = await page.evaluate((cases) => {
			// The browser's own colour maths: paint the background, then the colour over it, and
			// read the pixel back, so any colour syntax and any see-through part come out as sRGB.
			const canvas = document.createElement('canvas')
			canvas.width = canvas.height = 1
			const ctx = canvas.getContext('2d', { willReadFrequently: true })!
			const paint = (...colors: string[]) => {
				for (const color of colors) {
					ctx.fillStyle = color
					ctx.fillRect(0, 0, 1, 1)
				}
				return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]
			}
			const luminance = (rgb: number[]) => {
				const [r, g, b] = rgb.map((v) => {
					const c = v / 255
					return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
				})
				return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
			}
			const ratio = (a: number[], b: number[]) => {
				const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y)
				return (hi! + 0.05) / (lo! + 0.05)
			}
			// The first solid background, from the element up.
			const behind = (el: Element | null): string => {
				for (; el; el = el.parentElement) {
					const bg = getComputedStyle(el).backgroundColor
					ctx.clearRect(0, 0, 1, 1)
					ctx.fillStyle = bg
					ctx.fillRect(0, 0, 1, 1)
					if (ctx.getImageData(0, 0, 1, 1).data[3] === 255) return bg
				}
				return 'rgb(255 255 255)'
			}

			const page = document.createElement('div')
			page.className = 'sf-depth-0'
			document.body.append(page)
			return cases.map((c) => {
				page.innerHTML = c.html
				const box = page.firstElementChild as HTMLElement
				let el: HTMLElement = box
				let color: string
				let under: string
				if (c.part === 'outline') {
					color = getComputedStyle(box).outlineColor
					under = behind(box.parentElement)
				} else if (c.part === 'edge' || c.part === 'focus') {
					if (c.part === 'focus') box.focus()
					color = getComputedStyle(box).borderTopColor
					under = behind(box.parentElement)
				} else if (c.part === 'link') {
					el = box.querySelector('a')!
					color = getComputedStyle(el).color
					under = behind(el)
				} else {
					color = getComputedStyle(box).color
					under = behind(box)
				}
				const back = paint(under)
				return { name: c.name, least: c.least, ratio: ratio(paint(under, color), back) }
			})
		}, CASES)

		for (const m of measured)
			expect(m.ratio, `${m.name}: ${m.ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(m.least)
	})
