import { createVuestic } from 'vuestic-ui'

// import 'vuestic-ui/css'
// Vuestic css used when tailwind is used to stop conflicts
import 'vuestic-ui/styles/essential.css'
import 'vuestic-ui/styles/typography.css'
import config from '../vuestic.my.config'
export const vuestic = createVuestic({ config })

import './assets/main.css'

import { initPromptModal } from '@/services/promptModal'
import zitadelAuth from '@/services/zitadelAuth'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './config/queryClient'

declare module 'vue' {
	interface ComponentCustomProperties {
		$zitadel: typeof zitadelAuth
	}
}

import globalKeyPlugin from './plugins/globalKeyPlugin'

zitadelAuth.oidcAuth.startup().then((ok: boolean) => {
	if (!ok) {
		// ok=false means this window is a callback page (silent renew iframe or popup); don't mount.
		return
	}

	// Prune stale PKCE state entries (abandoned login attempts). Using
	// clearStaleState instead of a manual wipe preserves any active state
	// entry needed by an in-flight redirect callback — the manual approach
	// deleted the code verifier before the router's signinRedirectCallback
	// could read it, breaking every fresh login via redirect.
	zitadelAuth.oidcAuth.mgr.clearStaleState()

	if (!zitadelAuth.oidcAuth.isAuthenticated) {
		// Fire-and-forget: uses the Zitadel SSO cookie to restore tokens without
		// a new login. user.value is reactive so the UI updates when it resolves.
		zitadelAuth.oidcAuth.mgr.signinSilent().catch(() => {
			// Zitadel session also expired; user must log in manually.
		})
	}

	const app = createApp(App)
	app.config.globalProperties.$zitadel = zitadelAuth
	app.use(globalKeyPlugin)
	app.use(createPinia())
	app.use(VueQueryPlugin, { queryClient })
	app.use(router)
	app.use(vuestic)
	initPromptModal(app._context)
	app.mount('#app')
})
