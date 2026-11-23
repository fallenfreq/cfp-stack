import { expect, test } from './fixtures'
import { steadyRequests, useTheme } from './helpers'
import { TEST_THEME_CLASS } from './testTheme'

// A context changes a box's surface, never its fill: floating, contained or pinned, a box keeps
// the fill it has for its loudness or kind, and a tint its coloured border (sf-system.md, "Fill
// parts"). Each fill is compared with the same box with no context, in light and dark, under the
// root theme and under the test theme, which sets fills of its own.

const FILLS = [
	{ name: 'a loud label', html: '<span class="sf-tag sf-loudness-3">Sale</span>' },
	{
		name: 'a loud label of a kind',
		html: '<span class="sf-tag sf-loudness-3 sf-variant-primary">New</span>',
	},
	{
		name: 'a tinted label',
		html: '<span class="sf-tag sf-loudness-2 sf-variant-danger">Late</span>',
		border: true,
	},
	{ name: 'a loud button', html: '<button class="sf sf-loudness-3">Save</button>' },
	{ name: 'an avatar', html: '<span class="sf-avatar">AB</span>' },
	{ name: 'a mark', html: '<span class="sf-badge"></span>' },
	{ name: 'an avatar on a card', html: '<span class="sf-avatar sf-depth-2">AB</span>' },
]

// Each context, as the classes it adds and the box it goes in.
const CONTEXTS = [
	{ name: 'floating', classes: 'sf-is-overlay', around: '' },
	{ name: 'contained', classes: 'sf-is-contained', around: '' },
	{ name: 'contained and floating', classes: 'sf-is-contained sf-is-overlay', around: '' },
	{ name: 'pinned', classes: 'sl-pin-right', around: 'sf-is-overflow-right' },
]

const MODES = [
	{ name: 'light', themeClass: '' },
	{ name: 'dark', themeClass: 'theme-dark' },
]

interface Look {
	background: string
	border: string
}

for (const mode of MODES)
	test(`a floating, contained or pinned box keeps its fill, ${mode.name}`, async ({
		page,
		themeClass,
	}) => {
		await steadyRequests(page)
		await page.goto('/')
		await useTheme(page, themeClass)
		const looks = await page.evaluate(
			({ fills, contexts, modeClass }) => {
				const cases = document.createElement('div')
				cases.className = `${modeClass} sf-depth-1`
				document.body.append(cases)
				const look = (around: string, html: string, classes: string) => {
					const holder = document.createElement('div')
					holder.className = around
					holder.innerHTML = html
					const box = holder.firstElementChild!
					if (classes) box.classList.add(...classes.split(' '))
					cases.append(holder)
					const style = getComputedStyle(box)
					return { background: style.backgroundColor, border: style.borderTopColor }
				}
				return fills.map((fill) => ({
					plain: look('', fill.html, ''),
					inContext: contexts.map((context) =>
						look(context.around, fill.html, context.classes),
					),
				}))
			},
			{ fills: FILLS, contexts: CONTEXTS, modeClass: mode.themeClass },
		)
		FILLS.forEach((fill, f) => {
			const { plain, inContext } = looks[f]!
			CONTEXTS.forEach((context, c) => {
				const seen: Look = inContext[c]!
				expect.soft(seen.background, `${fill.name}, ${context.name}`).toBe(plain.background)
				if (fill.border)
					expect
						.soft(seen.border, `${fill.name}'s border, ${context.name}`)
						.toBe(plain.border)
			})
		})
		// A fill beats a surface on the same box, and a theme's own fills are drawn.
		const plainLook = (name: string) =>
			looks[FILLS.findIndex((fill) => fill.name === name)]!.plain
		const avatar = plainLook('an avatar')
		expect
			.soft(plainLook('an avatar on a card').background, 'an avatar on a card')
			.toBe(avatar.background)
		if (themeClass === TEST_THEME_CLASS) {
			expect.soft(avatar.background, "the theme's own avatar fill").toBe('rgb(128, 0, 128)')
			expect
				.soft(plainLook('a loud label of a kind').background, "the theme's own loud fill")
				.toBe('rgb(200, 100, 0)')
		}
	})

test("a box inside a loud one doesn't take its fill", async ({ page, themeClass }) => {
	await steadyRequests(page)
	await page.goto('/')
	await useTheme(page, themeClass)
	const [inLoud, inCard] = await page.evaluate(() =>
		['sf-tag sf-loudness-3', 'sf-depth-1'].map((outer) => {
			const holder = document.createElement('div')
			holder.className = outer
			holder.innerHTML = '<button class="sf sf-is-contained">Close</button>'
			document.body.append(holder)
			return getComputedStyle(holder.firstElementChild!).backgroundColor
		}),
	)
	expect(inLoud).toBe(inCard)
})
