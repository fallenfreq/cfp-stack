import TiptapTest from '@/components/editor/TiptapTest.vue'
import { type Component } from 'vue'
import { VaButton } from 'vuestic-ui'
// Export an explicit list of components to register in the editor
interface ComponentData {
	component: Component
	props: Record<string, any>
	// https://tiptap.dev/docs/editor/core-concepts/schema
	// setting to block will allow inline but will wrap it in a block tag
	// the default block tag is 'paragraph'
	content: string // 'inline*' | 'block*'
	atom?: boolean
	contenteditable?: boolean
	contentAs?: 'div' | 'span' | 'p'
}

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
	},
} satisfies Record<string, ComponentData>

export { editorComponents, type ComponentData }
