import { shallowRef } from 'vue'

// Ask the user something in a modal dialog (PromptModal, mounted once in App, shows it).
// Plain functions, so they work outside components.

export type ModalRequest =
	| {
			kind: 'prompt'
			message: string
			transform: ((value: string) => string) | undefined
			resolve: (value: string | null) => void
	  }
	| {
			kind: 'confirm'
			message: string
			okText: string
			resolve: (ok: boolean) => void
	  }

export const modalRequest = shallowRef<ModalRequest | null>(null)

// A new question replaces one still open; the old one resolves as cancelled.
function open(request: ModalRequest) {
	cancelModal()
	modalRequest.value = request
}

/** Closes the open question as cancelled: prompt gives null, confirm false. */
export function cancelModal(): void {
	const request = modalRequest.value
	if (!request) return
	modalRequest.value = null
	if (request.kind === 'prompt') request.resolve(null)
	else request.resolve(false)
}

/** Ask for text. Resolves null when cancelled. */
export function showPrompt(
	message: string,
	transform?: (value: string) => string,
): Promise<string | null> {
	return new Promise((resolve) => open({ kind: 'prompt', message, transform, resolve }))
}

/** Ask a yes/no question, e.g. before deleting. The OK button is marked as danger. */
export function showConfirm(message: string, { okText = 'OK' } = {}): Promise<boolean> {
	return new Promise((resolve) => open({ kind: 'confirm', message, okText, resolve }))
}
