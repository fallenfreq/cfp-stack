import { inject, type InjectionKey } from 'vue'

const injectSafe = <T>(key: InjectionKey<T>): T => {
	const injected = inject(key, null)
	if (!injected) {
		throw new Error(`${String(key)} is not provided!`)
	}
	return injected
}

const AddKeyCombo: InjectionKey<(keyCombo: string, func: () => void) => void>
	= Symbol('AddKeyCombo')

const RemoveKeyCombo: InjectionKey<(keyCombo: string) => void> = Symbol('RemoveKeyCombo')

export { AddKeyCombo, RemoveKeyCombo, injectSafe }
