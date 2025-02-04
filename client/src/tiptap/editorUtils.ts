// the utils file needs editor and lowlight, both from the editor.vue
import { useEditorStore } from '@/stores/editorStore'
import { type Editor } from '@tiptap/vue-3'
import highlight from 'highlight.js'
import { useToast } from 'vuestic-ui'

// Function to format selected text using Prettier
const prettifySelectedCode = async (editor: Editor) => {
  const editorStore = useEditorStore()

  const { anchor } = editor.state.selection
  const resolvedPos = editor.state.doc.resolve(anchor)
  const startPosition = resolvedPos.start(resolvedPos.depth)
  const endPosition = resolvedPos.end(resolvedPos.depth)
  const textNode = editor.state.doc.nodeAt(startPosition)
  const selectedContent = textNode?.textContent || ''

  if (!selectedContent) return editor.chain().focus().setTextSelection(anchor).run()

  editor.commands.selectParentNode()
  const parentNode = editor.state.doc.nodeAt(editor.state.selection.from)
  const setLanguage = parentNode?.attrs.language
  const language = editorStore.detectLanguage(selectedContent, setLanguage)

  let message = ''
  if (language === null) {
    message = 'Auto detect failed to detect language.'
  } else if (language === undefined) {
    message = 'Formatting is only available for code blocks.'
  } else if (!editorStore.isPrettierLanguage(language)) {
    const languageName = highlight.getLanguage(language)?.name?.split(',')[0]
    message = `Formatting is not supported for the detected language: ${languageName}`
  }

  if (!language || !editorStore.isPrettierLanguage(language)) {
    useToast().notify({
      duration: 10000,
      color: 'warning',
      position: 'bottom-right',
      message
    })
    return
  }

  try {
    const formattedContent = await editorStore.prettifyCode(selectedContent, language)

    editor.commands.insertContentAt(
      { from: startPosition, to: endPosition },
      { type: 'text', text: formattedContent }
    )
  } catch (error) {
    useToast().notify({
      duration: 10000,
      color: 'danger',
      position: 'bottom-right',
      message: 'Formatting error: ' + (error instanceof Error ? error.message : 'Unknown error')
    })
  }
  editor.chain().focus().setTextSelection(anchor).run()
}

// Utility functions to escape and unescape HTML content
const escapeHTML = (html: string) => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export { prettifySelectedCode, escapeHTML }
