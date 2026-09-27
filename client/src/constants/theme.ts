export const THEMES = ['light', 'dark', 'pink'] as const
export type Theme = (typeof THEMES)[number]
