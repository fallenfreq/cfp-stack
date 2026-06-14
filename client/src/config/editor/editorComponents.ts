import LayoutCard from '@/components/editor/layout/LayoutCard.vue'
import LayoutCenter from '@/components/editor/layout/LayoutCenter.vue'
import LayoutColumns from '@/components/editor/layout/LayoutColumns.vue'
import LayoutSection from '@/components/editor/layout/LayoutSection.vue'
import LayoutSplit from '@/components/editor/layout/LayoutSplit.vue'
import TiptapTest from '@/components/editor/TiptapTest.vue'
import { enumAttr } from '@/editor/enumAttr'
import { type Component } from 'vue'
import { VaButton } from 'vuestic-ui'

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
	// https://tiptap.dev/docs/editor/core-concepts/schema
	// setting to block will allow inline but will wrap it in a block tag
	// the default block tag is 'paragraph'
	content: string // 'inline*' | 'block*'
	atom?: boolean
	contenteditable?: boolean
	contentAs?: 'div' | 'span' | 'p'
	// Opts the NodeViewWrapper into contenteditable=false at rest so non-editable
	// decorations inside the Vue component can't have a cursor placed in them.
	// Leave false for pure layout components — that lets mobile drag-select pass
	// through the wrapper cleanly (no contenteditable=false boundary).
	decorative?: boolean
}

const ALIGN_OPTIONS = ['start', 'center', 'end', 'stretch'] as const

const editorComponents = {
	VaButton: {
		uuid: 'b8a538a1-d902-4a46-b303-f09c76fe220c',
		alias: 'va-button',
		component: VaButton,
		// VaButton.props is Vuestic's internal prop-options object; cast at the boundary.
		props: VaButton.props as Record<string, PropSpec>,
		content: 'inline*',
	},
	TiptapTest: {
		uuid: 'a47e28a5-fd9d-40e9-bd74-819301247e9d',
		alias: 'tiptap-test',
		component: TiptapTest,
		props: {},
		content: 'block*',
		decorative: true,
	},
	LayoutSection: {
		uuid: '535f350e-b2d6-4675-a371-cb582fee557c',
		alias: 'layout-section',
		component: LayoutSection,
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
		props: {
			variant: enumAttr('elevated', [
				'elevated',
				'outlined',
				'filled',
				'plain',
				'feature',
			] as const),
		},
		content: 'block*',
	},
} satisfies Record<string, ComponentData>

export { editorComponents, type ComponentData, type PropSpec }
