import { createVuestic } from 'vuestic-ui'

// import 'vuestic-ui/css'
// Vuestic css used when tailwind is used to stop conflicts
import 'vuestic-ui/styles/essential.css'
import 'vuestic-ui/styles/typography.css'
import config from '../vuestic.my.config'
export const vuestic = createVuestic({ config })

import PrimeVue from 'primevue/config'
import Aura from './presets/aura'

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import zitadelAuth from '@/services/zitadelAuth'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './config/queryClient'

declare module 'vue' {
  interface ComponentCustomProperties {
    $zitadel: typeof zitadelAuth
  }
}

import globalKeyPlugin from './plugins/globalKeyPlugin'

zitadelAuth.oidcAuth.startup().then((ok: boolean) => {
  if (ok) {
    const app = createApp(App)
    app.config.globalProperties.$zitadel = zitadelAuth
    app.use(globalKeyPlugin)
    app.use(createPinia())
    app.use(VueQueryPlugin, { queryClient })
    app.use(router)
    app.use(vuestic)
    app.use(PrimeVue, {
      unstyled: true,
      pt: Aura
    })
    app.mount('#app')
  } else {
    console.error('Startup was not ok')
  }
})
