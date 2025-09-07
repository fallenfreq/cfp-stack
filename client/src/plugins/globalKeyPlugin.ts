import { AddKeyCombo, RemoveKeyCombo } from '@/symbols'
import type { App, Plugin } from 'vue'

type KeyFunctionMap = Record<string, () => void>

const keyFunctionMap: KeyFunctionMap = {}

const handleKeydown = (event: KeyboardEvent): void => {
	const keyCombo = `${event.metaKey ? 'Cmd+' : ''}${event.ctrlKey ? 'Ctrl+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`

	const keyFunction = keyFunctionMap[keyCombo]
	if (keyFunction) {
		keyFunction()
	}
}

const addKeyCombo = (keyCombo: string, func: () => void): void => {
	if (keyFunctionMap[keyCombo]) {
		console.log(`Key combo ${keyCombo} is already registered.`)
		return
	}
	keyFunctionMap[keyCombo] = func
}

const removeKeyCombo = (keyCombo: string): void => {
	delete keyFunctionMap[keyCombo]
}

const globalKeyPlugin: Plugin = {
	install(app: App) {
		app.provide(AddKeyCombo, addKeyCombo)
		app.provide(RemoveKeyCombo, removeKeyCombo)
		window.addEventListener('keydown', handleKeydown)
	},
}

export default globalKeyPlugin
export { addKeyCombo, removeKeyCombo }
