export const THEMES = ['light', 'dark', 'pink'] as const
export type Theme = (typeof THEMES)[number]

export const isValidTheme = (value: string): value is Theme => {
	return THEMES.includes(value as Theme)
}
