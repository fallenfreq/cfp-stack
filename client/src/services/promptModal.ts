import { createApp, ref, type AppContext } from 'vue'
import PromptModal from '@/components/input/promptModal.vue'

import { vuestic } from '@/main'
import { useColors } from 'vuestic-ui'
const { currentPresetName } = useColors()

const isVisible = ref(false)
const message = ref('')
const resolvePrompt = ref<((value: string | null) => void) | null>(null)

// Function to show the prompt
const showPrompt = async (promptMessage: string): Promise<string | null> => {
  message.value = promptMessage
  isVisible.value = true
  return new Promise((resolve) => {
    resolvePrompt.value = resolve
  })
}

// Function to handle modal closure
const handleClose = (value: string | null) => {
  isVisible.value = false
  resolvePrompt.value?.(value)
  resolvePrompt.value = null
}

// Mount the modal component globally
const initPromptModal = (appContext?: AppContext) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const app = createApp(PromptModal, {
    isVisible,
    message: message,
    rootCurrentPresetName: currentPresetName,
    onSubmit: handleClose
  })

  if (appContext) {
    app._context = appContext
  }
  app.use(vuestic)
  app.mount(container)
  return showPrompt
}

export { initPromptModal }
