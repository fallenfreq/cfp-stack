import { fileURLToPath, URL } from 'node:url'
import extractCssVars from './plugins/extractCssVars'
import { piniaHMRPlugin } from './plugins/piniaHMR'
import touchFileAfterBuild from './plugins/touchFileAfterBuild'
import createTrackChangesPlugin from './plugins/trackChangesPlugin'

import vue from '@vitejs/plugin-vue'
// import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	// In dev, /styles/sf-system lives on the wrangler server (8788) — proxy
	// from vite (5173) so the runtime <link> resolves under the same origin
	// in both modes. Prod: cloudflare pages serves both on one origin.
	server: {
		proxy: {
			'/styles': 'http://localhost:8788',
		},
	},
	build: {
		outDir: '../api/client_dist',
		// Esbuild's CSS minifier rewrites `(max-width: X)` to range syntax
		// `(width <= X)` when the target supports it. Range syntax landed in
		// Chrome 104 / Safari 16.4 / Firefox 110; older browsers silently
		// drop the rule. Pinning cssTarget below those versions keeps the
		// traditional media-feature syntax in the bundle.
		cssTarget: ['chrome87', 'edge88', 'firefox78', 'safari14'],
	},
	css: {
		preprocessorOptions: {
			sass: {
				api: 'modern-compiler',
			},
			scss: {
				api: 'modern-compiler',
			},
		},
	},
	plugins: [
		piniaHMRPlugin(),
		createTrackChangesPlugin([
			{
				file: './src/assets/base.css',
				onChange: () => {
					console.log('Compiling Vuestic-compat CSS variables')
					extractCssVars('./src/assets/base.css', './cssVariables')
				},
			},
		]),
		// This is to prevent a bug that stops wrangler pages dev [directory] from working
		// it is supposed to refresh when static assets change but it doesn't
		touchFileAfterBuild('../api/functions/trpc/[[trpc]].js'),
		vue(),
		// vueJsx(),
		Components({
			dts: true, // enabled by default if `typescript` is installed
			resolvers: [],
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})
