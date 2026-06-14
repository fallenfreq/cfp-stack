import router from '@/router'
import { trpc } from '@/trpc'
import { prettifyCode } from '@/utils/codeFormatting'
import { initGenerateBlueprintHTML } from '@/utils/editor/htmlBlueprint'
import { escapeHTML } from '@/utils/stringUtils'
import type { Editor } from '@tiptap/vue-3'
import { defineStore } from 'pinia'
import { ref, shallowRef, watch, watchEffect, type ShallowRef } from 'vue'
import { useToast } from 'vuestic-ui'

export const useEditorStore = defineStore('editor', () => {
	const codeViewDefault = false
	const isCodeView = ref(codeViewDefault)
	const editor: ShallowRef<Editor | null> = shallowRef(null)
	let generateBlueprintHTML: ReturnType<typeof initGenerateBlueprintHTML> | null = null

	const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
	const currentPageId = ref<number | null>(null)
	const currentSlug = ref<string | null>(null)

	watchEffect(() => {
		if (editor.value && !generateBlueprintHTML) {
			generateBlueprintHTML = initGenerateBlueprintHTML(editor.value)
		}
	})

	const setEditor = (newEditor: Editor | null) => {
		editor.value = newEditor
		isCodeView.value = codeViewDefault
		generateBlueprintHTML = null
	}

	const toggleCodeView = async () => {
		if (!editor.value) return
		if (isCodeView.value) {
			editor.value.commands.setContent(editor.value.getText())
		} else {
			if (generateBlueprintHTML === null) return
			const htmlContent = await prettifyCode(generateBlueprintHTML(), 'html')
			editor.value.commands.setContent(
				`<pre><code class="language-html">${escapeHTML(htmlContent)}</code></pre>`,
			)
		}
		isCodeView.value = !isCodeView.value
	}

	const loadPage = async (slug: string) => {
		const page = await trpc.sitePages.get.query({ slug })
		if (!page) {
			useToast().notify({
				duration: 5000,
				color: 'warning',
				position: 'bottom-right',
				message: `Page "${slug}" not found`,
			})
			return
		}
		const applyContent = () => {
			try {
				editor.value!.commands.setContent(JSON.parse(page.contentJson), {
					errorOnInvalidContent: true,
				})
			} catch (err) {
				useToast().notify({
					duration: 8000,
					color: 'danger',
					position: 'bottom-right',
					message: err instanceof Error ? err.message : 'Failed to load page content',
				})
				return
			}
			currentPageId.value = page.pageId
			currentSlug.value = slug
		}
		if (editor.value) {
			applyContent()
		} else {
			const unwatch = watch(editor, (e) => {
				if (e) {
					unwatch()
					applyContent()
				}
			})
		}
	}

	const save = async () => {
		if (!editor.value) return
		saveStatus.value = 'saving'
		const contentJson = JSON.stringify(editor.value.getJSON())
		try {
			if (currentPageId.value !== null) {
				await trpc.sitePages.update.mutate({ pageId: currentPageId.value, contentJson })
			} else {
				const slug = crypto.randomUUID()
				const result = await trpc.sitePages.create.mutate({ slug, contentJson })
				if (!result?.pageId) throw new Error('Failed to create page: no ID returned')
				currentPageId.value = result.pageId
				currentSlug.value = slug
				router.replace({ name: 'editor', params: { slug } })
			}
			saveStatus.value = 'saved'
			setTimeout(() => {
				if (saveStatus.value === 'saved') saveStatus.value = 'idle'
			}, 2000)
			useToast().notify({
				duration: 2000,
				color: 'success',
				position: 'bottom-right',
				message: 'Saved',
			})
		} catch (error) {
			saveStatus.value = 'error'
			setTimeout(() => {
				if (saveStatus.value === 'error') saveStatus.value = 'idle'
			}, 5000)
			const message = error instanceof Error ? error.message : 'Save failed'
			useToast().notify({
				duration: 8000,
				color: 'danger',
				position: 'bottom-right',
				message,
			})
		}
	}

	return {
		editor,
		setEditor,
		isCodeView,
		toggleCodeView,
		saveStatus,
		currentPageId,
		currentSlug,
		loadPage,
		save,
	}
})
