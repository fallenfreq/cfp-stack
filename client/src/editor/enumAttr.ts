import type { ExtensionAttribute } from '@tiptap/vue-3'

export const enumAttr = <T>(defaultValue: T, options: readonly T[]) => ({
	default: defaultValue,
	options,
	validate: (value: unknown) => {
		if (!options.includes(value as T)) {
			throw new Error(
				`Expected one of ${options.map(String).join(', ')}, got "${String(value)}"`,
			)
		}
	},
})

// Enum attribute serialized to/from a single HTML data-* attribute.
// Defaults are omitted from rendered HTML so the markup stays tidy.
export const dataAttr = <T extends string>(
	name: string,
	defaultValue: T,
	options: readonly T[],
) => ({
	...enumAttr(defaultValue, options),
	parseHTML: (el: HTMLElement) => (el.getAttribute(`data-${name}`) ?? defaultValue) as T,
	renderHTML: (attrs: Record<string, unknown>) =>
		attrs[name] && attrs[name] !== defaultValue ? { [`data-${name}`]: attrs[name] } : {},
})

// Tiptap's official `Attribute` is a type alias (not an interface), so we can't
// merge `options` into it via declaration merging. Narrow extension-attribute
// entries with this cast at the boundary instead — `extensionManager.attributes`
// is where consumers like the attribute panel discover the `options` field
// that `enumAttr` writes onto the spec.
export type EnumExtensionAttribute = ExtensionAttribute & {
	attribute: { options?: readonly unknown[] }
}
