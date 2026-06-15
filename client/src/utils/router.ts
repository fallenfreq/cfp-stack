import type { AtLeastOne } from './types'

// Vue Router types params as string | string[] | undefined (noUncheckedIndexedAccess).
// Required route segments are never undefined or empty arrays at runtime.
// The AtLeastOne cast and undefined fallback are both unreachable in practice.
export function paramString(v: string | string[] | undefined): string {
	if (v === undefined) return ''
	if (!Array.isArray(v)) return v
	const [head] = v as AtLeastOne<string>
	return head
}
