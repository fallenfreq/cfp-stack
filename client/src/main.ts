// import { createApp } from 'vue'
// import './style.css'
// import App from './App.vue'

// createApp(App).mount('#app')

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import zitadelAuth from '@/services/zitadelAuth'

declare module 'vue' {
  interface ComponentCustomProperties {
    $zitadel: typeof zitadelAuth
  }
}

zitadelAuth.oidcAuth.startup().then((ok: any) => {
  if (ok) {
    const app = createApp(App)
    app.use(router)
    app.config.globalProperties.$zitadel = zitadelAuth
    app.mount('#app')
  } else {
    console.error('Startup was not ok')
  }
})
