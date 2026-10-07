import './assets/main.css'

import { notifyError } from '@/services/errors'
import { whenSignInKnown } from '@/services/session'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './config/queryClient'

import globalKeyPlugin, { addKeyCombo } from './plugins/globalKeyPlugin'
import { useDarkModeStore } from './stores/darkModeStore'
import { useThemeTokensStore } from './stores/themeTokensStore'

// Not waited for: the app shows now and follows sign-in when it's known; pages that need it
// wait for it themselves (router).
whenSignInKnown()

const app = createApp(App)
// What a component's code didn't catch (its handlers, hooks, watchers, render) says so, as a failed
// read or write does; the console says where it came from, as Vue's own warning did.
app.config.errorHandler = (error, _instance, info) => {
	console.warn(`Unhandled error during ${info}`)
	notifyError(error)
}
// So does a promise that failed with nothing waiting on it (a store's watcher, a map's listener);
// notifyError logs it, in place of the browser.
window.addEventListener('unhandledrejection', (event) => {
	event.preventDefault()
	notifyError(event.reason)
})
app.use(globalKeyPlugin)
app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(router)

// Fire-and-forget — palette computed refs update reactively when tokens arrive.
// /styles/sf-system CSS is served from edge cache so the stylesheet itself is instant.
useThemeTokensStore().hydrate().catch(console.error)

// Secret pink mode, from anywhere in the app.
const darkMode = useDarkModeStore()
addKeyCombo('Ctrl+Shift+K', darkMode.togglePinkMode)

app.mount('#app')
