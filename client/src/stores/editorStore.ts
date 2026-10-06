import router from '@/router'
import { showPrompt } from '@/services/promptModal'
import { notify } from '@/services/toast'
import { trpc } from '@/trpc'
import { prettifyCode } from '@/utils/codeFormatting'
import { initGenerateBlueprintHTML } from '@/utils/editor/htmlBlueprint'
import type { Editor } from '@tiptap/vue-3'
import { defineStore } from 'pinia'
import { ref, shallowRef, type ShallowRef } from 'vue'

export const useEditorStore = defineStore('editor', () => {
	const codeViewDefault = false
	const isCodeView = ref(codeViewDefault)
	const editor: ShallowRef<Editor | null> = shallowRef(null)
	let generateBlueprintHTML: ReturnType<typeof initGenerateBlueprintHTML> | null = null

	const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
	const currentPageId = ref<number | null>(null)
	const currentSlug = ref<string | null>(null)
	const currentName = ref<string | null>(null)
	const currentPublished = ref(false)
	const pendingAutoTag = ref<number | null>(null)

	const setEditor = (newEditor: Editor | null) => {
		editor.value = newEditor
		isCodeView.value = codeViewDefault
		generateBlueprintHTML = null
		// No editor, no page being edited: what opens next starts unnamed and unsaved, so Save
		// can't write it over the page edited before.
		if (!newEditor) {
			currentPageId.value = null
			currentSlug.value = null
			currentName.value = null
			currentPublished.value = false
			pendingAutoTag.value = null
			saveStatus.value = 'idle'
		}
	}

	// The code view's code (CodeView keeps it up to date) and the code the page holds: what the
	// code view opened with, or last put into the page. Code that differs from it is an edit.
	const code = ref('')
	const pageCode = ref('')

	// Changed code goes into the page as one edit, which Undo takes back. Returns why not if the
	// page can't read it.
	const applyCode = (): string | null => {
		if (!editor.value || code.value === pageCode.value) return null
		try {
			editor.value.commands.setContent(code.value, { errorOnInvalidContent: true })
		} catch (error) {
			// TipTap's check quotes the last element it refused; its opening tag finds it.
			const cause =
				error instanceof Error && error.cause instanceof Error ? error.cause.message : ''
			const tag = cause.match(/<[^>]*>/)?.[0]
			return tag
				? `The page can't read ${tag} in this code.`
				: "The page can't read this code."
		}
		pageCode.value = code.value
		return null
	}
	const codeProblem = (message: string) => notify({ duration: 8000, variant: 'danger', message })

	// The page is written as code for the code view, which shows instead of it. Leaving puts what
	// changed into the page, and the keys back on it; code the page can't read keeps the code view
	// open.
	const toggleCodeView = async () => {
		const from = editor.value
		if (!from) return
		if (isCodeView.value) {
			const problem = applyCode()
			if (problem) {
				codeProblem(problem)
				return
			}
			isCodeView.value = false
			from.commands.focus()
			return
		}
		try {
			if (!generateBlueprintHTML) generateBlueprintHTML = initGenerateBlueprintHTML(from)
			const written = await prettifyCode(generateBlueprintHTML(), 'html')
			// Another page opened meanwhile.
			if (editor.value !== from) return
			code.value = written
			pageCode.value = written
			isCodeView.value = true
		} catch (err) {
			notify({
				duration: 8000,
				variant: 'danger',
				message: `Code view failed: ${err instanceof Error ? err.message : String(err)}`,
			})
		}
	}

	// The stored page at an address, for the view to open in a new editor; null if there's none.
	const fetchPage = (slug: string) => trpc.adminPages.getBySlug.query({ slug })

	// The page the editor on screen edits, set once its editor has opened it.
	const setPage = (page: NonNullable<Awaited<ReturnType<typeof fetchPage>>>) => {
		currentPageId.value = page.pageId
		currentSlug.value = page.slug
		currentName.value = page.name || null
		currentPublished.value = page.published
	}

	// Saves the editor on screen. If another opens while it saves (the address moved on), the save
	// still finishes, but the page it made stays out of the editor now on screen.
	const save = async () => {
		const from = editor.value
		if (!from) return
		// What's saved is the page, with the code view's changes in it.
		const problem = isCodeView.value ? applyCode() : null
		if (problem) {
			codeProblem(`Not saved: ${problem}`)
			return
		}
		const stillOpen = () => editor.value === from
		saveStatus.value = 'saving'
		const json = from.getJSON()
		const contentJson = JSON.stringify(
			json.content?.length ? json : { type: 'doc', content: [{ type: 'paragraph' }] },
		)
		try {
			if (currentPageId.value !== null) {
				await trpc.adminPages.update.mutate({ pageId: currentPageId.value, contentJson })
			} else {
				const autoTag = pendingAutoTag.value
				let name = currentName.value?.trim() || null
				if (!name) {
					name = await showPrompt('Page name')
					if (name === null) {
						saveStatus.value = 'idle'
						return
					}
				}
				const result = await trpc.adminPages.create.mutate({ name, contentJson })
				if (!result?.pageId) throw new Error('Failed to create page: no ID returned')
				if (stillOpen()) {
					currentPageId.value = result.pageId
					currentSlug.value = result.slug
					currentName.value = name
				}
				if (autoTag !== null) {
					await trpc.adminPages.update.mutate({
						pageId: result.pageId,
						tagIds: [autoTag],
					})
					if (stillOpen()) pendingAutoTag.value = null
				}
				if (stillOpen())
					router.replace({ name: 'editor-page', params: { slug: result.slug } })
			}
			saveStatus.value = 'saved'
			setTimeout(() => {
				if (saveStatus.value === 'saved') saveStatus.value = 'idle'
			}, 2000)
			notify({
				duration: 2000,
				variant: 'success',
				message: 'Saved',
			})
		} catch (error) {
			saveStatus.value = 'error'
			setTimeout(() => {
				if (saveStatus.value === 'error') saveStatus.value = 'idle'
			}, 5000)
			const message = error instanceof Error ? error.message : 'Save failed'
			notify({
				duration: 8000,
				variant: 'danger',
				message,
			})
		}
	}

	const renamePage = async (newName: string) => {
		if (!newName.trim()) return
		currentName.value = newName.trim()
		if (!currentPageId.value) return
		await trpc.adminPages.update.mutate({ pageId: currentPageId.value, name: newName.trim() })
	}

	return {
		editor,
		setEditor,
		isCodeView,
		toggleCodeView,
		code,
		saveStatus,
		currentPageId,
		currentSlug,
		currentName,
		currentPublished,
		pendingAutoTag,
		fetchPage,
		setPage,
		save,
		renamePage,
	}
})
