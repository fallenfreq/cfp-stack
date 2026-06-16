import PromptModal from '@/components/input/PromptModal.vue'
import { vuestic } from '@/main'
import { createApp, ref, type AppContext } from 'vue'
import { useColors } from 'vuestic-ui'

const { currentPresetName } = useColors()

const isVisible = ref(false)
const message = ref('')
const transform = ref<((v: string) => string) | undefined>(undefined)
const resolvePrompt = ref<((value: string | null) => void) | null>(null)

let modalInstance: HTMLElement | null = null
let appInstance: ReturnType<typeof createApp> | null = null

let _prompt:
	| ((message: string, inputTransform?: (v: string) => string) => Promise<string | null>)
	| null = null

const handleClose = (value: string | null) => {
	isVisible.value = false
	resolvePrompt.value?.(value)
	resolvePrompt.value = null
}

export function showPrompt(
	message: string,
	transform?: (v: string) => string,
): Promise<string | null> {
	if (!_prompt) throw new Error('showPrompt called before initPromptModal')
	return _prompt(message, transform)
}

export function initPromptModal(appContext: AppContext): void {
	if (_prompt) return
	modalInstance = document.createElement('div')
	document.body.appendChild(modalInstance)

	appInstance = createApp(PromptModal, {
		isVisible,
		message,
		transform,
		rootCurrentPresetName: currentPresetName,
		onSubmit: handleClose,
	})

	appInstance._context = appContext
	appInstance.use(vuestic)
	appInstance.mount(modalInstance)

	_prompt = async (
		promptMessage: string,
		inputTransform?: (v: string) => string,
	): Promise<string | null> => {
		message.value = promptMessage
		transform.value = inputTransform
		isVisible.value = true
		return new Promise((resolve) => {
			resolvePrompt.value = resolve
		})
	}
}
