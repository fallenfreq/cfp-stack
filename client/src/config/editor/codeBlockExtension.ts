import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { lowlight } from './lowlight'

// Every code block's <pre> wears `sf` (the theme's code-block look) and `hljs` (highlight.js
// colours), in the editor and on published pages alike.
export const CodeBlockExtension = CodeBlockLowlight.configure({
	lowlight,
	HTMLAttributes: { class: 'sf hljs' },
})
