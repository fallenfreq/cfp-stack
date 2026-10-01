// A theme that looks deliberately unlike the root theme: twice the spacing, a wide page margin,
// a narrower page, another font and taller lines, and divide lines drawn as a shadow instead of
// a border. globalSetup.ts adds it to the tests' throwaway database only; it is never seeded.
// Every layout check runs under it as well as the root theme, because a theme changes the
// numbers layouts read, never how they behave (sf-system.md, "Theme contract").

export const TEST_THEME_CLASS = 'theme-test'

export const TEST_THEME_TOKENS = [
	{ name: '--sf-spacing-2xs', value: '0.5rem', kind: 'length' },
	{ name: '--sf-spacing-xs', value: '1rem', kind: 'length' },
	{ name: '--sf-spacing-sm', value: '1.5rem', kind: 'length' },
	{ name: '--sf-spacing-md', value: '2rem', kind: 'length' },
	{ name: '--sf-spacing-lg', value: '3rem', kind: 'length' },
	{ name: '--sf-spacing-xl', value: '5rem', kind: 'length' },
	{ name: '--sf-spacing_page', value: '4rem', kind: 'length' },
	{ name: '--sf-width_page', value: '50rem', kind: 'length' },
	{ name: '--sf-font-1', value: 'Georgia, serif', kind: 'text' },
	{ name: '--sf-leading-relaxed', value: '2', kind: 'number' },
] as const

export const TEST_THEME_RULES = [
	{ classNames: ['sf-divide-y'], pseudo: ' > * + *', cssProperty: 'border-top', value: 'none' },
	{
		classNames: ['sf-divide-y'],
		pseudo: ' > * + *',
		cssProperty: 'box-shadow',
		value: '0 -3px 0 rgb(var(--sf-border_color))',
	},
] as const
