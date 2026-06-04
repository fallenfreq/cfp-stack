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

// Export an explicit list of components to register in the editor
interface ComponentData {
	component: Component
	props: Record<string, PropSpec | any>
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

const SPACING_OPTIONS = ['none', 'xs', 'sm', 'md', 'lg', 'xl']
const COLLAPSE_OPTIONS = ['never', 'xs', 'sm', 'md']
const RADIUS_OPTIONS = ['none', 'sm', 'md', 'lg'] as const

const withOptions = (
	componentProps: Record<string, any>,
	optionsMap: Record<string, readonly string[]>,
): Record<string, PropSpec> =>
	Object.fromEntries(
		Object.entries(componentProps).map(([k, v]) => [
			k,
			optionsMap[k] ? { ...v, ...enumAttr(v.default, optionsMap[k]) } : v,
		]),
	)

const editorComponents = {
	VaButton: {
		component: VaButton,
		props: VaButton.props,
		content: 'inline*',
	},
	TiptapTest: {
		component: TiptapTest,
		props: {},
		content: 'block*',
		decorative: true,
	},
	LayoutSection: {
		component: LayoutSection,
		props: withOptions(LayoutSection.props, {
			gap: SPACING_OPTIONS,
			padding: SPACING_OPTIONS,
			align: ['start', 'center', 'end', 'stretch'],
		}),
		content: 'block*',
	},
	LayoutColumns: {
		component: LayoutColumns,
		props: withOptions(LayoutColumns.props, {
			columns: ['2', '3', '4'],
			gap: SPACING_OPTIONS,
			collapse: COLLAPSE_OPTIONS,
			align: ['start', 'center', 'end', 'stretch'],
		}),
		content: 'block*',
	},
	LayoutSplit: {
		component: LayoutSplit,
		props: withOptions(LayoutSplit.props, {
			split: ['1/4', '1/3', '2/5', '1/2', '3/5', '2/3', '3/4'],
			gap: SPACING_OPTIONS,
			collapse: COLLAPSE_OPTIONS,
			align: ['start', 'center', 'end', 'stretch'],
		}),
		content: 'block*',
	},
	LayoutCenter: {
		component: LayoutCenter,
		props: withOptions(LayoutCenter.props, {
			maxWidth: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
			padding: SPACING_OPTIONS,
			gap: SPACING_OPTIONS,
		}),
		content: 'block*',
	},
	LayoutCard: {
		component: LayoutCard,
		props: withOptions(LayoutCard.props, {
			padding: SPACING_OPTIONS,
			variant: ['elevated', 'outlined', 'filled', 'plain', 'feature'],
			radius: RADIUS_OPTIONS,
		}),
		content: 'block*',
	},
} satisfies Record<string, ComponentData>

export { editorComponents, RADIUS_OPTIONS, type ComponentData, type PropSpec }
