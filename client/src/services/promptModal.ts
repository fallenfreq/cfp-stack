import PromptModal from '@/components/input/PromptModal.vue'
import { vuestic } from '@/main'
import { createApp, ref, type AppContext } from 'vue'
import { useColors } from 'vuestic-ui'

const { currentPresetName } = useColors()

const isVisible = ref(false)
const message = ref('')
const resolvePrompt = ref<((value: string | null) => void) | null>(null)

// Singleton container
let modalInstance: HTMLElement | null = null
let appInstance: ReturnType<typeof createApp> | null = null

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
	if (!modalInstance) {
		// Create only one container
		modalInstance = document.createElement('div')
		document.body.appendChild(modalInstance)

		// Create only one app instance
		appInstance = createApp(PromptModal, {
			isVisible,
			message: message,
			rootCurrentPresetName: currentPresetName,
			onSubmit: handleClose,
		})

		if (appContext) {
			appInstance._context = appContext
		}

		appInstance.use(vuestic)
		appInstance.mount(modalInstance)
	}
	return showPrompt
}

export { initPromptModal }
