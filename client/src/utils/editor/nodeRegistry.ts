import { editorComponents } from '@/config/editor/editorComponents'

// UUID-keyed components in editorComponents are treated as first-party shareable
// components — the same model as user-generated ones that will be published via
// the store. When the store ships, replace this static map with a DB lookup:
//   components(uuid, name, schema, ...) + site_component_aliases(site_id, uuid, alias)
// Content JSON already uses UUIDs as node type names, so no migration will be needed.
// If a component is removed from editorComponents, keep its UUID in a deprecated list
// here so old content_json doesn't silently drop nodes.
const uuidToAlias: Record<string, string> = Object.fromEntries(
	Object.values(editorComponents).map((c) => [c.uuid, c.alias]),
)

/** A block's one name wherever the editor shows it (the node path, the pickers, the slash menu, the
 * toolbar's buttons), so each calls it by the same name: the name the project gives it, a
 * component's alias, and a built-in block's type (`bulletList`). */
export function getNodeAlias(typeName: string): string {
	return uuidToAlias[typeName] ?? typeName
}

/** A heading's name at one of its levels (`heading 2`), where the level is what's picked. */
export const getHeadingName = (level: number): string => `${getNodeAlias('heading')} ${level}`
