import TiptapTest from '@/components/editor/TiptapTest.vue'
import LayoutCard from '@/components/layout/LayoutCard.vue'
import LayoutCenter from '@/components/layout/LayoutCenter.vue'
import LayoutColumns from '@/components/layout/LayoutColumns.vue'
import LayoutCover from '@/components/layout/LayoutCover.vue'
import LayoutSplit from '@/components/layout/LayoutSplit.vue'
import LayoutStack from '@/components/layout/LayoutStack.vue'
import { enumAttr } from '@/editor/enumAttr'
import { type Component } from 'vue'

interface PropSpec {
	default: unknown
	options?: readonly unknown[]
	validate?: (value: unknown) => void
}

interface ComponentData {
	uuid: string
	alias: string
	component: Component
	props: Record<string, PropSpec>
	// What the block holds, as a TipTap content expression: 'block*' (text typed straight in
	// goes into a paragraph) or 'inline*'.
	content: string
	atom?: boolean
	contenteditable?: boolean
	contentAs?: 'div' | 'span' | 'p'
}

const ALIGN_OPTIONS = ['start', 'center', 'end', 'stretch'] as const
const POSITION_OPTIONS = ['start', 'center', 'end'] as const
const COVER_MIN_HEIGHT_OPTIONS = ['default', 'compact', 'viewport', 'fill'] as const

const editorComponents = {
	TiptapTest: {
		uuid: 'a47e28a5-fd9d-40e9-bd74-819301247e9d',
		alias: 'tiptap-test',
		component: TiptapTest,
		props: {},
		content: 'block*',
	},
	LayoutStack: {
		uuid: '535f350e-b2d6-4675-a371-cb582fee557c',
		alias: 'layout-stack',
		component: LayoutStack,
		props: {
			align: enumAttr('stretch', ALIGN_OPTIONS),
		},
		content: 'block*',
	},
	LayoutColumns: {
		uuid: '13c6b633-ee82-4bc9-951d-fc52b933eec9',
		alias: 'layout-columns',
		component: LayoutColumns,
		props: {
			columns: enumAttr(2, [2, 3, 4] as const),
			align: enumAttr('stretch', ALIGN_OPTIONS),
		},
		content: 'block*',
	},
	LayoutSplit: {
		uuid: 'e34ddbe8-aa1b-49e3-8760-22b754f1866d',
		alias: 'layout-split',
		component: LayoutSplit,
		props: {
			split: enumAttr('1/3', ['1/4', '1/3', '2/5', '1/2', '3/5', '2/3', '3/4'] as const),
			align: enumAttr('stretch', ALIGN_OPTIONS),
		},
		content: 'block*',
	},
	LayoutCenter: {
		uuid: '9e832dd1-e9b7-4a81-a233-3ceeeb6f0bdd',
		alias: 'layout-center',
		component: LayoutCenter,
		props: {
			maxWidth: enumAttr('lg', ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const),
		},
		content: 'block*',
	},
	LayoutCard: {
		uuid: '1e4d245a-16ac-4e60-96e9-1cf4ff6e2b93',
		alias: 'layout-card',
		component: LayoutCard,
		props: {},
		content: 'block*',
	},
	LayoutCover: {
		uuid: '7f0b8f26-3f14-4d3e-9a2b-c1d5e8f47b90',
		alias: 'layout-cover',
		component: LayoutCover,
		props: {
			positionY: enumAttr('center', POSITION_OPTIONS),
			positionX: enumAttr('center', POSITION_OPTIONS),
			minHeight: enumAttr('default', COVER_MIN_HEIGHT_OPTIONS),
		},
		content: 'block*',
	},
} satisfies Record<string, ComponentData>

export { editorComponents, type ComponentData, type PropSpec }
