// Thin wrappers around CSSStyleDeclaration so we don't roll a CSS parser.
// The browser handles var(), color-mix(), comments, casing, quoted values, !important.

export function getStyleProp(style: string | null, prop: string): string {
	const tmp = document.createElement('div')
	tmp.style.cssText = style ?? ''
	return tmp.style.getPropertyValue(prop)
}

export function setStyleProp(style: string | null, prop: string, value: string | null): string {
	const tmp = document.createElement('div')
	tmp.style.cssText = style ?? ''
	if (value === null || value === '') tmp.style.removeProperty(prop)
	else tmp.style.setProperty(prop, value)
	return tmp.style.cssText
}
