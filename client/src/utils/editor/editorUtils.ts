// the utils file needs editor and lowlight, both from the editor.vue
import { type Editor } from '@tiptap/vue-3'
import highlight from 'highlight.js'
import { useToast } from 'vuestic-ui'
import { type Lowlight } from '@/config/editor/lowlight'
import { isPrettierLanguage, prettifyCode } from '@/utils/codeFormatting'

const detectLanguage = (code: string, editor: Editor, setLanguage: string | null) => {
  if (setLanguage === null) {
    const lowlight = getExtensionOptions(editor, 'codeBlock')?.lowlight as Lowlight | undefined
    return lowlight?.highlightAuto(code).data?.language || null
  }
  return setLanguage
}

function getExtensionOptions<T = any>(editor: Editor, name: string): T | undefined {
  return editor.extensionManager.extensions.find((ext) => ext.name === name)?.options as
    | T
    | undefined
}

const prettifySelectedCode = async (editor: Editor) => {
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
  const language = detectLanguage(selectedContent, editor, setLanguage)
  let message = ''
  if (language === null) {
    message = 'Auto detect failed to detect language.'
  } else if (language === undefined) {
    message = 'Formatting is only available for code blocks.'
  } else if (!isPrettierLanguage(language)) {
    const languageName = highlight.getLanguage(language)?.name?.split(',')[0]
    message = `Formatting is not supported for the detected language: ${languageName}`
  }

  if (!language || !isPrettierLanguage(language)) {
    useToast().notify({
      duration: 10000,
      color: 'warning',
      position: 'bottom-right',
      message
    })
    return
  }

  try {
    const formattedContent = await prettifyCode(selectedContent, language)

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

export { prettifySelectedCode, getExtensionOptions }
