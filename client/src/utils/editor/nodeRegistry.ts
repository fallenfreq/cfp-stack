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

export function getNodeAlias(typeName: string): string {
	return uuidToAlias[typeName] ?? typeName
}
