import { fileURLToPath, URL } from 'node:url'
import extractCssVars from './plugins/extractCssVars'
import { piniaHMRPlugin } from './plugins/piniaHMR'
import touchFileAfterBuild from './plugins/touchFileAfterBuild'
import createTrackChangesPlugin from './plugins/trackChangesPlugin'

import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	// In dev, the stylesheet, the API and signing in live on the wrangler server (8788) —
	// proxy from vite (5173) so the page calls its own origin in both modes. Prod:
	// cloudflare pages serves them all on one origin. The API and signing in keep the
	// Host the browser used: the server builds addresses and checks origins from it.
	server: {
		proxy: {
			'/styles': 'http://localhost:8788',
			'/trpc': { target: 'http://localhost:8788', changeOrigin: false },
			'/auth/': { target: 'http://localhost:8788', changeOrigin: false },
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
					console.log('Extracting CSS variables from base.css')
					extractCssVars('./src/assets/base.css', './cssVariables')
				},
			},
		]),
		// wrangler pages dev doesn't reload when the built client changes, only when a function
		// does: touching one after each build makes it pick the new client up.
		touchFileAfterBuild('../api/functions/trpc/[[trpc]].js'),
		vue(),
		Components({
			dts: true,
			resolvers: [],
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})
