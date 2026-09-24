// Static component preview — no wrangler, no API, no dev server left running.
//
//   pnpm preview:components            build only
//   pnpm preview:components --serve    build, then serve out/ at http://localhost:4173
//
// 1. sf-system.css: runs the real seed + CSS generator against an in-memory database.
// 2. app.css: client/src/assets/main.css through the project's PostCSS (Tailwind).
// 3. components.css: the <style> blocks of every component the stories rendered.
// 4. One static HTML page per story (client/preview/stories.ts), rendered with Vue SSR.
//
// Pages carry a small script that switches themes and emulates useScrollOverflow
// (toggles sf-is-overflow-* on sl-scroll-x / sl-scroll-y) so overflow treatments show.
import vue from '@vitejs/plugin-vue'
import { cpSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import Components from 'unplugin-vue-components/vite'
import { createServer, preprocessCSS } from 'vite'
import { compileStyle, parse } from 'vue/compiler-sfc'
import { createMemoryD1 } from './d1Memory.mjs'

const previewDir = dirname(fileURLToPath(import.meta.url))
const clientDir = dirname(previewDir)
const repoRoot = dirname(clientDir)
const apiDir = join(repoRoot, 'api')
const outDir = join(previewDir, 'out')

const started = Date.now()
const log = (msg) => console.log(`[preview] ${msg}`)

// drizzle-orm is an api dependency; import its ESM d1 entry from there.
async function importDrizzleD1() {
	const pkgDir = realpathSync(join(apiDir, 'node_modules/drizzle-orm'))
	const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
	const entry = pkg.exports['./d1'].import
	const file = typeof entry === 'string' ? entry : entry.default
	return import(pathToFileURL(join(pkgDir, file)).href)
}

const renderedSfcs = new Set()
const server = await createServer({
	root: clientDir,
	configFile: false,
	logLevel: 'warn',
	appType: 'custom',
	server: { middlewareMode: true, hmr: false, ws: false, fs: { allow: [repoRoot] } },
	optimizeDeps: { noDiscovery: true, include: [] },
	resolve: {
		alias: [
			// Auth never runs in the preview; its library chain doesn't load under Node either.
			{
				find: /^@\/services\/zitadelAuth$/,
				replacement: join(previewDir, 'stubs/zitadelAuth.ts'),
			},
			// The attribute row's style editor needs a browser; the preview never shows it.
			{
				find: /^\.\/StyleAttrEditor\.vue$/,
				replacement: join(previewDir, 'stubs/StyleAttrEditor.ts'),
			},
			{ find: '@', replacement: join(clientDir, 'src') },
		],
	},
	plugins: [
		vue(),
		Components({ dts: false }),
		{
			name: 'preview:track-sfc',
			transform(_code, id) {
				if (id.endsWith('.vue')) renderedSfcs.add(id)
			},
		},
	],
})
const load = (absPath) => server.ssrLoadModule(`/@fs${absPath}`)

// Runs after the module finishes evaluating so the page-template constants below exist.
async function main() {
	try {
		rmSync(outDir, { recursive: true, force: true })
		mkdirSync(outDir, { recursive: true })
		cpSync(join(clientDir, 'public'), outDir, { recursive: true })

		// 1. sf-system.css
		const { drizzle } = await importDrizzleD1()
		const db = drizzle(createMemoryD1(join(apiDir, 'migrations')))
		const { seed } = await load(join(apiDir, 'src/domain/seed.ts'))
		await seed(db)
		const { emitStylesheet } = await load(join(apiDir, 'src/domain/generateCss.ts'))
		writeFileSync(join(outDir, 'sf-system.css'), await emitStylesheet(db))
		log('sf-system.css generated from seed.ts')

		// 2. app.css — Tailwind resolves content globs relative to the client dir.
		process.chdir(clientDir)
		const mainCssPath = join(clientDir, 'src/assets/main.css')
		const app = await preprocessCSS(
			readFileSync(mainCssPath, 'utf8'),
			mainCssPath,
			server.config,
		)
		writeFileSync(join(outDir, 'app.css'), app.code.replaceAll('url(/', 'url(./'))
		log('app.css built (main.css + Tailwind)')

		// 4. stories (before 3, so we know which components rendered)
		const { stories, renderStory } = await load(join(previewDir, 'render.ts'))
		const pages = []
		for (const story of stories) {
			let html
			try {
				html = await renderStory(story)
			} catch (err) {
				console.error(`[preview] ${story.id} failed:`, err)
				html = `<pre class="preview-error">${escapeHtml(String(err?.stack ?? err))}</pre>`
			}
			writeFileSync(join(outDir, `${story.id}.html`), page(story, html))
			pages.push(story)
		}
		writeFileSync(join(outDir, 'index.html'), indexPage(pages))
		log(`${pages.length} story pages rendered`)

		// 3. components.css
		let componentsCss = ''
		for (const file of [...renderedSfcs].sort()) {
			const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file })
			if (!descriptor.styles.length) continue
			const scopeId =
				(await server.ssrLoadModule(file)).default?.__scopeId ?? 'data-v-preview'
			for (const block of descriptor.styles) {
				if (block.lang && block.lang !== 'css') {
					console.warn(`[preview] skipped <style lang="${block.lang}"> in ${file}`)
					continue
				}
				const compiled = compileStyle({
					source: block.content,
					filename: file,
					id: scopeId,
					scoped: block.scoped,
				})
				let code = compiled.code
				if (/@apply|@tailwind/.test(code))
					code = (await preprocessCSS(code, `${file}.css`, server.config)).code
				componentsCss += `/* ${relative(clientDir, file)} */\n${code}\n`
			}
		}
		writeFileSync(join(outDir, 'components.css'), componentsCss)
		log(`components.css from ${renderedSfcs.size} components`)

		// FontAwesome injects this with JS at app startup; without it icons have no size.
		cpSync(
			join(clientDir, 'node_modules/@fortawesome/fontawesome-svg-core/styles.css'),
			join(outDir, 'fontawesome.css'),
		)
		writeFileSync(join(outDir, 'preview.css'), PREVIEW_CSS)
		writeFileSync(join(outDir, 'preview.js'), PREVIEW_JS)
		log(
			`done in ${((Date.now() - started) / 1000).toFixed(1)}s → ${relative(repoRoot, outDir)}/index.html`,
		)
	} finally {
		await server.close()
	}
}

function escapeHtml(s) {
	return s.replace(
		/[&<>"]/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
	)
}

function head(title) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · preview</title>
<link rel="stylesheet" href="fontawesome.css">
<link rel="stylesheet" href="app.css">
<link rel="stylesheet" href="sf-system.css">
<link rel="stylesheet" href="components.css">
<link rel="stylesheet" href="preview.css">
</head>`
}

function toolbar(back) {
	return `<header class="preview-bar">
${back ? '<a href="index.html">← all</a>' : '<strong>Component preview</strong>'}
<select class="preview-theme" aria-label="Theme">
<option value="">Root</option><option value="theme-dark">Dark</option><option value="theme-pink">Pink</option>
</select>
</header>`
}

function page(story, html) {
	const frameStyle = story.maxWidth ? ` style="max-width: ${story.maxWidth}"` : ''
	return `${head(story.title)}
<body>
${toolbar(true)}
<main class="preview-main">
<h1 class="preview-title">${escapeHtml(story.title)}</h1>
${story.notes ? `<p class="preview-notes">${escapeHtml(story.notes)}</p>` : ''}
<div class="preview-frame"${frameStyle}>
${html}
</div>
</main>
<script src="preview.js"></script>
</body>
</html>
`
}

function indexPage(stories) {
	const items = stories
		.map((s) => `<li><a href="${s.id}.html">${escapeHtml(s.title)}</a></li>`)
		.join('\n')
	return `${head('Component preview')}
<body>
${toolbar(false)}
<main class="preview-main">
<ul class="preview-index">
${items}
</ul>
<p class="preview-notes">Regenerate: <code>node client/preview/build.mjs</code></p>
</main>
<script src="preview.js"></script>
</body>
</html>
`
}

// Preview chrome only — prefixed classes so it never collides with sf/sl output.
const PREVIEW_CSS = `.preview-bar { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 8px 16px; border-bottom: 1px dashed #8886; font: 14px system-ui, sans-serif; }
.preview-main { padding: 16px; }
.preview-title { font: 600 16px system-ui, sans-serif; margin: 0 0 4px; }
.preview-notes { font: 13px system-ui, sans-serif; opacity: 0.7; margin: 0 0 12px; }
.preview-frame { outline: 1px dashed #8886; outline-offset: 4px; }
.preview-index { font: 15px system-ui, sans-serif; line-height: 2; padding-left: 20px; }
.preview-error { white-space: pre-wrap; color: #b00; font-size: 12px; }
`

// Theme switch + useScrollOverflow emulation (same thresholds as the composable).
const PREVIEW_JS = `(() => {
	const select = document.querySelector('.preview-theme')
	const apply = (cls) => {
		document.documentElement.classList.remove('theme-dark', 'theme-pink')
		if (cls) document.documentElement.classList.add(cls)
	}
	let saved = ''
	try { saved = localStorage.getItem('preview-theme') || '' } catch {}
	apply(saved)
	if (select) {
		select.value = saved
		select.addEventListener('change', () => {
			apply(select.value)
			try { localStorage.setItem('preview-theme', select.value) } catch {}
		})
	}

	const sync = (el) => {
		const cs = getComputedStyle(el)
		const eps = (p) => Math.max(parseFloat(cs[p]) || 0, 2)
		const set = (side, on) => el.classList.toggle('sf-is-overflow-' + side, on)
		if (el.classList.contains('sl-scroll-x')) {
			const max = el.scrollWidth - el.clientWidth
			set('left', el.scrollLeft > eps('paddingLeft'))
			set('right', max - el.scrollLeft > eps('paddingRight'))
		}
		if (el.classList.contains('sl-scroll-y')) {
			const max = el.scrollHeight - el.clientHeight
			set('top', el.scrollTop > eps('paddingTop'))
			set('bottom', max - el.scrollTop > eps('paddingBottom'))
		}
	}
	document.querySelectorAll('.sl-scroll-x, .sl-scroll-y').forEach((el) => {
		sync(el)
		el.addEventListener('scroll', () => sync(el), { passive: true })
		new ResizeObserver(() => sync(el)).observe(el)
	})
})()
`

await main()

// --serve: phone browsers can't open files in Termux's private storage, so serve out/ over
// a bare static server (no Vite, nothing watched). Rebuild in another session and reload.
if (process.argv.includes('--serve')) {
	const { createServer: createHttpServer } = await import('node:http')
	const { createReadStream, existsSync, statSync } = await import('node:fs')
	const { extname, normalize } = await import('node:path')
	const types = {
		'.html': 'text/html; charset=utf-8',
		'.css': 'text/css; charset=utf-8',
		'.js': 'text/javascript; charset=utf-8',
		'.woff2': 'font/woff2',
		'.png': 'image/png',
		'.ico': 'image/x-icon',
	}
	const port = Number(process.env.PORT) || 4173
	createHttpServer((req, res) => {
		const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
		const file = join(outDir, normalize(path === '/' ? '/index.html' : path))
		if (!file.startsWith(outDir) || !existsSync(file) || !statSync(file).isFile()) {
			res.writeHead(404).end('not found')
			return
		}
		res.writeHead(200, {
			'content-type': types[extname(file)] ?? 'application/octet-stream',
			'cache-control': 'no-store',
		})
		createReadStream(file).pipe(res)
	}).listen(port, () => log(`serving http://localhost:${port}  (Ctrl+C to stop)`))
}
