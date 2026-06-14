import { editorComponents } from '@/config/editor/editorComponents'

const uuidToAlias: Record<string, string> = Object.fromEntries(
	Object.values(editorComponents).map((c) => [c.uuid, c.alias]),
)

export function getNodeAlias(typeName: string): string {
	return uuidToAlias[typeName] ?? typeName
}
