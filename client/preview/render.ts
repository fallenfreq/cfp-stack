// Loaded through Vite's SSR loader so Vue, Pinia and the components share one module graph.
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import type { Story } from './stories'
import { stubs } from './stubs/components'

export async function renderStory(story: Story): Promise<string> {
	const app = createSSRApp({ render: story.render })
	app.use(createPinia())
	// Every path renders nothing: stories only need RouterLink and the current route.
	const router = createRouter({
		history: createMemoryHistory(),
		routes: [{ path: '/:any(.*)*', component: { render: () => null } }],
	})
	app.use(router)
	await router.push(story.route ?? '/')
	for (const [name, component] of Object.entries(stubs)) app.component(name, component)
	app.config.warnHandler = (msg) => console.warn(`  [vue] ${story.id}: ${msg}`)
	// SSR wraps <Transition appear> content in <template> for the client to hydrate; the
	// preview has no client JS, so unwrap it or the content never shows.
	return (await renderToString(app)).replace(/<\/?template>/g, '')
}

export { stories } from './stories'
