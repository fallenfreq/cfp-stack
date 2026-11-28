import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { settle, steadyRequests } from '../helpers'

// What the root theme draws on its surfaces can be seen (sf-system.md, "Fill and ink"): a line, a
// field's edge or its cursor reaches 3:1 on what's behind it, words 4.5:1 (WCAG 1.4.11,
// 1.4.3). A targeted line is a hint and isn't measured (sf-system.md, "Line parts"). Measured
// from what the browser draws, in light and dark, with the theme class on <html> as the app sets
// it, and with a real pointer over the element (and pressing it) where a case says so.

const MODES = [
	{ name: 'light', dark: false },
	{ name: 'dark', dark: true },
]

type Part = 'outline' | 'edge' | 'cursor' | 'link' | 'words' | 'hint'
type Pointer = 'over' | 'pressing'

// Each case on every surface it occurs on: the page and a bar or Card (depth 1), and, but for a
// block's lines, which are only ever in the page, a menu (depth 2) and a modal (depth 3) (owner,
// 2026-11-28).
const IN_PAGE = [
	{ name: 'the page', depth: 'sf-depth-0' },
	{ name: 'a bar', depth: 'sf-depth-1' },
]
const SURFACES = [
	...IN_PAGE,
	{ name: 'a menu', depth: 'sf-depth-2' },
	{ name: 'a modal', depth: 'sf-depth-3' },
]

const CASES: {
	name: string
	html: string
	part: Part
	least: number
	pointer?: Pointer
	inPage?: boolean
}[] = [
	{
		name: "a picked block's line",
		html: '<p class="sf-on-selected">Picked</p>',
		part: 'outline',
		least: 3,
		inPage: true,
	},
	{
		name: "a picked block's line with a warning",
		html: '<p class="sf-on-selected sf-is-warning">Warned</p>',
		part: 'outline',
		least: 3,
		inPage: true,
	},
	{
		name: "a picked block's line with an error",
		html: '<p class="sf-on-selected sf-is-error">Wrong</p>',
		part: 'outline',
		least: 3,
		inPage: true,
	},
	{
		name: "a block's warning line",
		html: '<p class="sf-is-warning">Warned</p>',
		part: 'outline',
		least: 3,
		inPage: true,
	},
	{
		name: "a block's error line",
		html: '<p class="sf-is-error">Wrong</p>',
		part: 'outline',
		least: 3,
		inPage: true,
	},
	{
		name: "a field's error line",
		html: '<input class="sf sf-field sf-is-error" />',
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
		name: "a field's cursor, which shows its focus",
		html: '<input class="sf sf-field" />',
		part: 'cursor',
		least: 3,
	},
	{
		name: "a field's hint",
		html: '<input class="sf sf-field" placeholder="Untitled" />',
		part: 'hint',
		least: 4.5,
	},
	// Quiet is dimmed, never past what can be read (sf-system.md, "Text parts").
	{
		name: 'quiet words',
		html: '<button class="sf sf-loudness-1">Back</button>',
		part: 'words',
		least: 4.5,
	},
	{
		name: 'a quiet icon',
		html: '<span class="material-symbols-rounded sf-icon sf-loudness-1">close</span>',
		part: 'words',
		least: 3,
	},
	{
		name: 'a drag handle',
		html: '<div class="sf sf-drag-handle">⠿</div>',
		part: 'words',
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
	// Picked keeps a fill's own words (sf-system.md, "Text parts").
	{
		name: 'words on a picked loud brand button',
		html: '<button class="sf sf-loudness-3 sf-variant-primary sf-on-selected">Save</button>',
		part: 'words',
		least: 4.5,
	},
	// Being on never takes a fill away, so its words stay on it.
	{
		name: 'words on a loud red button that is on',
		html: '<button class="sf sf-loudness-3 sf-variant-danger sf-on-current">Delete</button>',
		part: 'words',
		least: 4.5,
	},
	// Under the pointer a loud thing is dark, so its words are light, fill or none.
	{
		name: 'words on a loud link under the pointer',
		html: '<a class="sf sf-loudness-3 sf-on-hover sf-on-active">Go</a>',
		part: 'words',
		least: 4.5,
		pointer: 'over',
	},
	// On, it keeps the brand's words on its tint under the pointer: hover × loud alone would give
	// light words there (1:1). 3:1, as words on a hover tint dip below 4.5:1 (light 4.22:1), an
	// accepted limit (docs/plans/contrast-on-white.md).
	{
		name: 'words on a loud link that is on, under the pointer',
		html: '<a class="sf sf-loudness-3 sf-on-hover sf-on-current">Go</a>',
		part: 'words',
		least: 3,
		pointer: 'over',
	},
	{
		name: 'words on a loud link being pressed',
		html: '<a class="sf sf-loudness-3 sf-on-hover sf-on-active">Go</a>',
		part: 'words',
		least: 4.5,
		pointer: 'pressing',
	},
]

// Each case is drawn alone in a box of its own, of the surface given, kept in view so the pointer
// reaches it.
const show = (page: Page, html: string, depth = 'sf-depth-0') =>
	page.evaluate(
		([markup, depth]) => {
			let box = document.getElementById('contrast-case')
			if (!box) {
				box = document.createElement('div')
				box.id = 'contrast-case'
				box.style.cssText = 'position: fixed; inset: 40% auto auto 40%; z-index: 2147483647'
				document.body.append(box)
			}
			box.className = depth!
			box.innerHTML = markup!
		},
		[html, depth] as const,
	)

// The pointer away, over the case, or pressing it; then any fade the theme starts is finished, so
// what's measured is what the pointer leaves, not a step on the way.
const putPointer = async (page: Page, pointer: Pointer | undefined) => {
	await page.mouse.move(0, 0)
	if (pointer) await page.hover('#contrast-case > *')
	if (pointer === 'pressing') await page.mouse.down()
	await page.evaluate(() => {
		for (const animation of document.getAnimations()) animation.finish()
	})
	await settle(page)
}

const measure = (page: Page, part: Part) =>
	page.evaluate((part) => {
		// The browser's own colour maths: paint each colour over the last, and read the pixel
		// back, so any colour syntax and any see-through part come out as sRGB.
		const canvas = document.createElement('canvas')
		canvas.width = canvas.height = 1
		const ctx = canvas.getContext('2d', { willReadFrequently: true })!
		const paint = (colors: string[]) => {
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
		// What's behind: every background from the page down to this element, laid one over
		// the other, as a loud fill under the pointer or pressed is see-through.
		const behind = (el: Element | null) => {
			const backgrounds: string[] = []
			for (; el; el = el.parentElement)
				backgrounds.unshift(getComputedStyle(el).backgroundColor)
			return ['rgb(255 255 255)', ...backgrounds]
		}

		const box = document.getElementById('contrast-case')!.firstElementChild as HTMLElement
		let color: string
		let under: string[]
		if (part === 'outline') {
			const own = getComputedStyle(box)
			// No line drawn: nothing to see.
			color = own.outlineStyle === 'none' ? 'transparent' : own.outlineColor
			under = behind(box.parentElement)
		} else if (part === 'cursor') {
			// In the field, on its own background; with no colour of its own, its words'.
			box.focus()
			const own = getComputedStyle(box)
			color = own.caretColor === 'auto' ? own.color : own.caretColor
			under = behind(box)
		} else if (part === 'hint') {
			color = getComputedStyle(box, '::placeholder').color
			under = behind(box)
		} else if (part === 'edge') {
			color = getComputedStyle(box).borderTopColor
			under = behind(box.parentElement)
		} else {
			const el = part === 'link' ? box.querySelector('a')! : box
			color = getComputedStyle(el).color
			under = behind(el)
		}
		return ratio(paint([...under, color]), paint(under))
	}, part)

for (const mode of MODES)
	test(`lines, focus edges and words can be seen on every surface, ${mode.name}`, async ({
		page,
	}) => {
		await steadyRequests(page)
		await page.goto('/')
		await page.evaluate(
			(dark) => document.documentElement.classList.toggle('theme-dark', dark),
			mode.dark,
		)
		await settle(page)

		for (const c of CASES)
			for (const surface of c.inPage ? IN_PAGE : SURFACES) {
				await show(page, c.html, surface.depth)
				await putPointer(page, c.pointer)
				const measured = await measure(page, c.part)
				if (c.pointer === 'pressing') await page.mouse.up()
				expect
					.soft(measured, `${c.name}, on ${surface.name}: ${measured.toFixed(2)}:1`)
					.toBeGreaterThanOrEqual(c.least)
			}
	})

// Under the pointer, coloured words keep their colour at full strength: the editor's quiet amber
// "Next warning" stays amber (sf-system.md, "Text parts").
for (const mode of MODES)
	test(`a colour's words keep their colour under the pointer, ${mode.name}`, async ({ page }) => {
		await steadyRequests(page)
		await page.goto('/')
		await page.evaluate(
			(dark) => document.documentElement.classList.toggle('theme-dark', dark),
			mode.dark,
		)
		await show(
			page,
			'<button class="sf sf-loudness-1 sf-variant-warning sf-is-contained sf-on-hover">3</button>',
		)
		// Its colour at full strength, as an sRGB pixel.
		const words = () =>
			page.evaluate(() => {
				const el = document.getElementById('contrast-case')!.firstElementChild!
				const ctx = document.createElement('canvas').getContext('2d')!
				ctx.fillStyle = `rgb(from ${getComputedStyle(el).color} r g b / 1)`
				ctx.fillRect(0, 0, 1, 1)
				return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]
			})

		await putPointer(page, undefined)
		const atRest = await words()
		await putPointer(page, 'over')
		const over = await words()
		// The same colour, give or take a step of rounding in a channel; plain words would be far
		// off.
		const apart = Math.max(...over.map((channel, i) => Math.abs(channel - atRest[i]!)))
		expect(apart, `${over} under the pointer, ${atRest} at rest`).toBeLessThanOrEqual(1)
	})
