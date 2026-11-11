import { queryClient } from '@/config/queryClient'
import {
	codeWithCursor,
	cursorFromCode,
	lineOnScreen,
	scrollLineTo,
	type CodeCursor,
} from '@/editor/codeViewCursor'
import { underTheBar } from '@/editor/extensions/rememberCursor'
import router from '@/router'
import { notifyError } from '@/services/errors'
import { showPrompt } from '@/services/promptModal'
import { hasRole } from '@/services/session'
import { notify } from '@/services/toast'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { trpc } from '@/trpc'
import { cantKeep } from '@/utils/editor/cantKeep'
import { useMutation } from '@tanstack/vue-query'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection, Selection } from '@tiptap/pm/state'
import { createDocument, type Editor } from '@tiptap/vue-3'
import { defineStore } from 'pinia'
import { nextTick, ref, shallowRef, watch, type ShallowRef } from 'vue'

type NewPage = Parameters<typeof trpc.adminPages.create.mutate>[0]
type PageChanges = Parameters<typeof trpc.adminPages.update.mutate>[0]

export const useEditorStore = defineStore('editor', () => {
	const codeViewDefault = false
	const isCodeView = ref(codeViewDefault)
	const editor: ShallowRef<Editor | null> = shallowRef(null)

	const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
	const currentPageId = ref<number | null>(null)
	const currentSlug = ref<string | null>(null)
	const currentName = ref<string | null>(null)
	// The name the server has for the page on screen, which a refused rename goes back to.
	let savedName: string | null = null
	const currentPublished = ref(false)
	const pendingAutoTag = ref<number | null>(null)
	// The page on screen as it opened or was last saved, to tell edits from.
	let savedDoc: ProseMirrorNode | null = null

	// Whether whoever edits could save, for the rest of the visit: an admin, or one whose sign-in
	// has since ended (a save refused), who can sign in again and save.
	const couldSave = ref(false)
	watch(
		() => hasRole('admin'),
		(admin) => {
			if (admin) couldSave.value = true
		},
		{ immediate: true },
	)

	const setEditor = (newEditor: Editor | null) => {
		editor.value = newEditor
		savedDoc = newEditor?.state.doc ?? null
		isCodeView.value = codeViewDefault
		// No editor, no page being edited: what opens next starts unnamed and unsaved, so Save
		// can't write it over the page edited before.
		if (!newEditor) {
			currentPageId.value = null
			currentSlug.value = null
			currentName.value = null
			savedName = null
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
	// page can't read it, or would lose some of it.
	const applyCode = (): string | null => {
		const into = editor.value
		if (!into || code.value === pageCode.value) return null
		try {
			const doc = createDocument(code.value, into.schema, {}, { errorOnInvalidContent: true })
			const lost = cantKeep(into.schema, code.value)
			if (lost) return lost
			into.commands.setContent(doc)
		} catch (error) {
			// TipTap's check quotes the last element it refused; its opening tag finds it. Anything
			// else says why: a value a setting can't take says what it takes (a Columns block's
			// columns: 2, 3 or 4), the code block's highlighter a language it doesn't have.
			const cause =
				error instanceof Error && error.cause instanceof Error ? error.cause.message : ''
			const tag = cause.match(/<[^>]*>/)?.[0]
			if (tag) return `The page can't read ${tag} in this code.`
			return error instanceof Error
				? `The page can't read this code: ${error.message.replace(/[^.!?]$/, '$&.')}`
				: "The page can't read this code."
		}
		pageCode.value = code.value
		return null
	}
	const codeProblem = (message: string) => notify({ variant: 'danger', message })

	// The code view's own editor while it shows, and where its cursor opens: its place in the code,
	// and its line's height on the screen. In that editor the code starts after its code block's
	// opening, at 1.
	type CodeEditor = Pick<Editor, 'commands' | 'state' | 'view'>
	let codeEditor: CodeEditor | null = null
	let codeOpens: { cursor: CodeCursor | null; top: number } = { cursor: null, top: 0 }
	const CODE_START = 1

	/** The code view's editor, made (CodeView): its cursor goes where the page's was. */
	const codeViewOpened = (opened: CodeEditor) => {
		codeEditor = opened
		const { cursor, top } = codeOpens
		if (cursor)
			opened.commands.setTextSelection({
				from: cursor.anchor + CODE_START,
				to: cursor.head + CODE_START,
			})
		opened.commands.focus(null, { scrollIntoView: false })
		scrollLineTo(opened.view, opened.state.selection.from, top)
	}

	// The page is written as code for the code view, which shows instead of it. Leaving puts what
	// changed into the page, and the keys back on it; code the page can't read keeps the code view
	// open. The cursor goes across both ways, its line at the same height on the screen
	// (codeViewCursor.ts).
	const toggleCodeView = async () => {
		const from = editor.value
		if (!from) return
		if (isCodeView.value) {
			const was = from.state.selection
			const problem = applyCode()
			if (problem) {
				codeProblem(problem)
				return
			}
			const at = codeEditor?.state.selection
			const top = codeEditor && at ? lineOnScreen(codeEditor.view, at.from) : underTheBar()
			const written = code.value
			// Its select-all also takes in the code block around the code.
			const inCode = (pos: number) => Math.min(Math.max(pos - CODE_START, 0), written.length)
			const cursor = at && { anchor: inCode(at.anchor), head: inCode(at.head) }
			codeEditor = null
			isCodeView.value = false
			// The page shows again, to be measured.
			await nextTick()
			if (editor.value !== from) return
			const { doc } = from.state
			// Where the code puts it, or else where it was.
			const selection =
				(cursor && cursorFromCode(written, cursor, doc))
				?? Selection.near(doc.resolve(Math.min(was.from, doc.content.size)))
			// The toolbar works on a block selected, not one around it, as on one the warnings'
			// count goes to (EditorTopBar).
			if (selection instanceof NodeSelection)
				useDragHandleStore().setActiveDepth(doc.resolve(selection.from).depth + 1)
			// The same selection is left as it is, with the marks set for what's typed next (bold
			// turned on at the cursor), which setting it again would drop.
			if (!selection.eq(from.state.selection))
				from.view.dispatch(from.state.tr.setSelection(selection))
			from.commands.focus(null, { scrollIntoView: false })
			scrollLineTo(from.view, selection.from, top)
			return
		}
		try {
			const top = lineOnScreen(from.view, from.state.selection.from)
			const { code: written, cursor } = await codeWithCursor(from.state)
			// Another page opened meanwhile.
			if (editor.value !== from) return
			code.value = written
			pageCode.value = written
			codeOpens = { cursor, top }
			isCodeView.value = true
		} catch (err) {
			notify({
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
		savedName = currentName.value
		currentPublished.value = page.published
	}

	// The page's writes; one the server refuses says why (config/queryClient.ts).
	const createPage = useMutation(
		{ mutationFn: (input: NewPage) => trpc.adminPages.create.mutate(input) },
		queryClient,
	)
	const updatePage = useMutation(
		{ mutationFn: (input: PageChanges) => trpc.adminPages.update.mutate(input) },
		queryClient,
	)

	// The save under way, from its start (its name question included) to its end.
	let saving: Promise<void> | null = null

	/** The save under way, its name question included, or null: leaving waits for it. */
	const saveUnderWay = () => saving

	// A page given an address by its first save shows it, unless a Back or Forward the editor took
	// back is still landing: the address would take the place in the history of the page it went
	// to. It shows at the next save instead. The save ends once it shows, so a move waiting for
	// the save can't cancel it.
	const showAddress = async () => {
		const slug = currentSlug.value
		const shown = router.currentRoute.value
		if (!slug || shown.params['slug'] === slug) return
		if (router.options.history.location !== shown.fullPath) return
		await router.replace({ name: 'editor-page', params: { slug } })
	}

	const save = async () => {
		const run = saveNow()
		saving = run
		try {
			await run
		} finally {
			if (saving === run) saving = null
		}
	}

	// Saves the editor on screen. If another opens while it saves (the address moved on), the save
	// still finishes, but the page it made stays out of the editor now on screen.
	const saveNow = async () => {
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
		// The page as it's sent: what's typed while it saves stays unsaved.
		const doc = from.state.doc
		const json = from.getJSON()
		const contentJson = JSON.stringify(
			json.content?.length ? json : { type: 'doc', content: [{ type: 'paragraph' }] },
		)
		try {
			if (currentPageId.value !== null) {
				await updatePage.mutateAsync({ pageId: currentPageId.value, contentJson })
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
				// Made with its collection, in one write.
				const result = await createPage.mutateAsync({
					name,
					contentJson,
					tagIds: autoTag === null ? undefined : [autoTag],
				})
				if (!result?.pageId) throw new Error('Failed to create page: no ID returned')
				if (stillOpen()) {
					currentPageId.value = result.pageId
					currentSlug.value = result.slug
					currentName.value = name
					savedName = name
					pendingAutoTag.value = null
				}
			}
			if (stillOpen()) {
				savedDoc = doc
				await showAddress()
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
			// A refused write has said why already; this says anything else.
			notifyError(error)
		}
	}

	// A new name shows at once. If the server refuses it while it still shows, the name the server
	// has comes back.
	const rename = useMutation(
		{
			mutationFn: (input: { pageId: number; name: string }) =>
				trpc.adminPages.update.mutate(input),
			onMutate: ({ name }) => {
				currentName.value = name
			},
			onSuccess: (_page, { pageId, name }) => {
				if (currentPageId.value === pageId) savedName = name
			},
			onError: (_error, { pageId, name }) => {
				if (currentPageId.value === pageId && currentName.value === name)
					currentName.value = savedName
			},
		},
		queryClient,
	)

	/**
	 * Whether the page on screen has edits Save hasn't stored: it differs from how it opened or was
	 * last saved (undoing back to that is no edit), or the code view holds code not yet put into it.
	 */
	const hasUnsavedChanges = () => {
		const open = editor.value
		if (!open || !savedDoc) return false
		return !open.state.doc.eq(savedDoc) || (isCodeView.value && code.value !== pageCode.value)
	}

	// A page not saved yet keeps the name for its first save.
	const renamePage = (newName: string) => {
		const name = newName.trim()
		if (!name) return
		if (currentPageId.value === null) currentName.value = name
		else rename.mutate({ pageId: currentPageId.value, name })
	}

	return {
		editor,
		setEditor,
		isCodeView,
		toggleCodeView,
		codeViewOpened,
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
		saveUnderWay,
		couldSave,
		hasUnsavedChanges,
		renamePage,
	}
})
