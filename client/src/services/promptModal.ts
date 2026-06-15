import PromptModal from '@/components/input/PromptModal.vue'
import { vuestic } from '@/main'
import { createApp, ref, type AppContext } from 'vue'
import { useColors } from 'vuestic-ui'

const { currentPresetName } = useColors()

const isVisible = ref(false)
const message = ref('')
const resolvePrompt = ref<((value: string | null) => void) | null>(null)

let modalInstance: HTMLElement | null = null
let appInstance: ReturnType<typeof createApp> | null = null

export let showPrompt: ((message: string) => Promise<string | null>) | null = null

const handleClose = (value: string | null) => {
	isVisible.value = false
	resolvePrompt.value?.(value)
	resolvePrompt.value = null
}

export function initPromptModal(appContext: AppContext): void {
	if (showPrompt) return
	modalInstance = document.createElement('div')
	document.body.appendChild(modalInstance)

	appInstance = createApp(PromptModal, {
		isVisible,
		message: message,
		rootCurrentPresetName: currentPresetName,
		onSubmit: handleClose,
	})

	appInstance._context = appContext
	appInstance.use(vuestic)
	appInstance.mount(modalInstance)

	showPrompt = async (promptMessage: string): Promise<string | null> => {
		message.value = promptMessage
		isVisible.value = true
		return new Promise((resolve) => {
			resolvePrompt.value = resolve
		})
	}
}
