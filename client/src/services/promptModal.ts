import PromptModal from '@/components/input/PromptModal.vue'
import { createApp, ref, type AppContext } from 'vue'
import { useColors } from 'vuestic-ui'

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

	// useColors() must be called inside initPromptModal (which runs inside the
	// main app's async startup), not at module level — Vuestic composables
	// require a Vue context to resolve which app instance to use.
	const { currentPresetName } = useColors()

	appInstance = createApp(PromptModal, {
		isVisible,
		message,
		transform,
		rootCurrentPresetName: currentPresetName,
		onSubmit: handleClose,
	})

	// Share the main app's context (global components, Vuestic, etc.) so the
	// modal doesn't need a separate app.use(vuestic) — that would register
	// Vuestic in a second app and break "outside setup" composable checks.
	appInstance._context = appContext
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
