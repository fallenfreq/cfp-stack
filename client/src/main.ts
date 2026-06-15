import { createVuestic } from 'vuestic-ui'

// import 'vuestic-ui/css'
// Vuestic css used when tailwind is used to stop conflicts
import 'vuestic-ui/styles/essential.css'
import 'vuestic-ui/styles/typography.css'
import config from '../vuestic.my.config'
export const vuestic = createVuestic({ config })

import './assets/main.css'

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

	// Purge stale PKCE state entries on every startup. They accumulate with each
	// login attempt and are never needed after the flow completes. The user token
	// key ('user:https://...') has no 'oidc.' prefix so it is always preserved.
	Object.keys(localStorage)
		.filter((k) => k.startsWith('oidc.'))
		.forEach((k) => localStorage.removeItem(k))

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
	app.mount('#app')
})
