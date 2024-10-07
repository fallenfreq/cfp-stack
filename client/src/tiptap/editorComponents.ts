import { VaButton } from 'vuestic-ui'
import { type Component } from 'vue'
import TiptapTest from '@/components/TiptapTest.vue'
// Export an explicit list of components to register in the editor
type ComponentData = {
  component: Component
  props: { [key: string]: any }
  // https://tiptap.dev/docs/editor/core-concepts/schema
  // setting to block will allow inline but will wrap it in a block tag
  // the default block tag is 'paragraph'
  content: string // 'inline*' | 'block*'
  contenteditable?: boolean
  contentAs?: 'div' | 'span' | 'p'
}

const editorComponents = {
  VaButton: {
    component: VaButton,
    props: VaButton.props,
    content: 'inline*'
  },
  TiptapTest: {
    component: TiptapTest,
    props: {},
    content: 'block*',
    contenteditable: false
  }
} satisfies { [key: string]: ComponentData }

export { type ComponentData, editorComponents }
