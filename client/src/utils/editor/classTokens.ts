/**
 * getClassToken — extract the token value for a given prefix from a class list.
 * e.g. getClassToken('sf-radius-md foo', 'sf-radius-') → 'md'
 */
export function getClassToken(classList: string, prefix: string): string | null {
	for (const cls of classList.split(/\s+/)) {
		if (cls.startsWith(prefix)) return cls.slice(prefix.length)
	}
	return null
}

/**
 * setClassToken — replace any existing class with the given prefix, then add
 * prefix+token. Pass null to remove without adding.
 * e.g. setClassToken('sf-radius-sm foo', 'sf-radius-', 'lg') → 'foo sf-radius-lg'
 */
export function setClassToken(classList: string, prefix: string, token: string | null): string {
	const classes = classList.split(/\s+/).filter((c) => c && !c.startsWith(prefix))
	if (token !== null) classes.push(prefix + token)
	return classes.join(' ')
}
