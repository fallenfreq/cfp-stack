import { fileURLToPath, URL } from 'node:url'
import extractCssVars from './plugins/extractCssVars'
import createTrackChangesPlugin from './plugins/trackChangesPlugin'
import touchFileAfterBuild from './plugins/touchFileAfterBuild'
import { piniaHMRPlugin } from './plugins/piniaHMR'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../api/client_dist'
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler'
      },
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  plugins: [
    piniaHMRPlugin(),
    createTrackChangesPlugin([
      {
        file: './src/assets/base.css',
        onChange: () => {
          console.log('Compiling css variables for Vuestic')
          extractCssVars('./src/assets/base.css', './cssVariables')
        }
      }
    ]),
    // This is to prevent a bug that stops wrangler pages dev [directory] from working
    // it is supposed to refresh when static assets change but it doesn't
    touchFileAfterBuild('../api/functions/trpc/[[trpc]].js'),
    vue(),
    vueJsx(),
    Components({
      dts: true, // enabled by default if `typescript` is installed
      resolvers: [PrimeVueResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
