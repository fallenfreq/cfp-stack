import { test as base } from '@playwright/test'

export interface ThemeOption {
	/** The activation class of the theme the page is checked under; null for the root theme. */
	themeClass: string | null
}

// Every check takes the theme from its project (playwright.config.ts).
export const test = base.extend<ThemeOption>({ themeClass: [null, { option: true }] })
export { expect } from '@playwright/test'
