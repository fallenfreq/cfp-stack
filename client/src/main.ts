import './assets/main.css'

import { whenSignInKnown } from '@/services/session'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './config/queryClient'

import globalKeyPlugin from './plugins/globalKeyPlugin'
import { useThemeTokensStore } from './stores/themeTokensStore'

// Not waited for: the app shows now and follows sign-in when it's known; pages that need it
// wait for it themselves (router).
whenSignInKnown()

const app = createApp(App)
app.use(globalKeyPlugin)
app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(router)

// Fire-and-forget — palette computed refs update reactively when tokens arrive.
// /styles/sf-system CSS is served from edge cache so the stylesheet itself is instant.
useThemeTokensStore().hydrate().catch(console.error)

app.mount('#app')
