// Loaded through Vite's SSR loader so Vue, Pinia and the components share one module graph.
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import type { Story } from './stories'
import { stubs } from './stubs/components'

export async function renderStory(story: Story): Promise<string> {
	const app = createSSRApp({ render: story.render })
	app.use(createPinia())
	for (const [name, component] of Object.entries(stubs)) app.component(name, component)
	app.config.warnHandler = (msg) => console.warn(`  [vue] ${story.id}: ${msg}`)
	return renderToString(app)
}

export { stories } from './stories'
