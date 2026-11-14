/**
 * getClassToken — extract the token value for a given prefix from a class list.
 * e.g. getClassToken('sf-radius-2 foo', 'sf-radius-') → '2'
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
 * e.g. setClassToken('sf-radius-1 foo', 'sf-radius-', '3') → 'foo sf-radius-3'
 */
export function setClassToken(classList: string, prefix: string, token: string | null): string {
	const classes = classList.split(/\s+/).filter((c) => c && !c.startsWith(prefix))
	if (token !== null) classes.push(prefix + token)
	return classes.join(' ')
}
