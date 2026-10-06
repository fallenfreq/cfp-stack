import type { Plugin } from 'vue'

type KeyFunctionMap = Record<string, () => void>

const keyFunctionMap: KeyFunctionMap = {}

const handleKeydown = (event: KeyboardEvent): void => {
	const keyCombo = `${event.metaKey ? 'Cmd+' : ''}${event.ctrlKey ? 'Ctrl+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`

	const keyFunction = keyFunctionMap[keyCombo]
	if (keyFunction) {
		keyFunction()
	}
}

// Keys for the whole app, registered once at startup (main.ts).
const addKeyCombo = (keyCombo: string, func: () => void): void => {
	if (keyFunctionMap[keyCombo]) {
		console.log(`Key combo ${keyCombo} is already registered.`)
		return
	}
	keyFunctionMap[keyCombo] = func
}

const globalKeyPlugin: Plugin = {
	install() {
		window.addEventListener('keydown', handleKeydown)
	},
}

export default globalKeyPlugin
export { addKeyCombo }
