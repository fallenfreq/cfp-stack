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
import { noAnswer, notifyError } from '@/services/errors'
import { showConfirm, showPrompt } from '@/services/promptModal'
import { hasRole } from '@/services/session'
import { notify } from '@/services/toast'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { trpc } from '@/trpc'
import { cantKeep } from '@/utils/editor/cantKeep'
import { useMutation } from '@tanstack/vue-query'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection, Selection } from '@tiptap/pm/state'
import { createDocument, type Editor } from '@tiptap/vue-3'
import { TRPCClientError } from '@trpc/client'
import { defineStore } from 'pinia'
import { computed, nextTick, ref, shallowReactive, shallowRef, watch } from 'vue'

type NewPage = Parameters<typeof trpc.adminPages.create.mutate>[0]
type ContentSave = Parameters<typeof trpc.adminPages.save.mutate>[0]
type StoredPage = NonNullable<Awaited<ReturnType<typeof trpc.adminPages.getBySlug.query>>>

/**
 * The page open in the editor: made as its editor opens, replaced by the next. A save keeps the
 * page it started on and writes its answer there, so one opened meanwhile is left alone.
 */
export interface OpenPage {
	editor: Editor
	// A new page has none of these until its first save.
	pageId: number | null
	slug: string | null
	name: string | null
	// The name the server has, which a refused rename goes back to.
	savedName: string | null
	// The collection a new page is saved into.
	autoTag: number | null
	// The page as it is, kept up to date as it changes, and as it opened or was last saved: what
	// tells edits from.
	doc: ProseMirrorNode
	savedDoc: ProseMirrorNode
	saveStatus: 'idle' | 'saving' | 'saved' | 'error'
	// The save under way, from its start (its name question included) to its end.
	saving: Promise<void> | null
	// Closes the message that a refused save wasn't saved over, which the next save or leaving the
	// page makes untrue.
	closeNotSaved: (() => void) | null
	// What a save is taken by (the pages router's `save`): a key made as the page opens, the
	// version the server last confirmed (0 before a new page's first save), and the last one sent.
	// The key is the editor's, not each save's: a save sent again after more typing is a new save
	// and must still be taken.
	savedFrom: string
	version: number
	sentVersion: number
}

export const useEditorStore = defineStore('editor', () => {
	const codeViewDefault = false
	const isCodeView = ref(codeViewDefault)

	// Shallow both ways: a page opened replaces the one before, and changes to its own values show,
	// but its editor and documents stay TipTap's, not made reactive.
	const page = shallowRef<OpenPage | null>(null)
	const editor = computed(() => page.value?.editor ?? null)

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

	/**
	 * The page the view opened, in its editor, which has taken its content (TiptapEditor): a stored
	 * page, or a new one, saved into the collection `autoTag` if there's one.
	 */
	const openPage = (opened: Editor, stored: StoredPage | null, autoTag: number | null) => {
		const open = shallowReactive<OpenPage>({
			editor: opened,
			pageId: stored?.pageId ?? null,
			slug: stored?.slug ?? null,
			name: stored?.name || null,
			savedName: stored?.name || null,
			autoTag,
			doc: opened.state.doc,
			savedDoc: opened.state.doc,
			saveStatus: 'idle',
			saving: null,
			closeNotSaved: null,
			savedFrom: crypto.randomUUID(),
			version: stored?.version ?? 0,
			sentVersion: 0,
		})
		opened.on('transaction', ({ editor: changed }) => {
			open.doc = changed.state.doc
		})
		page.value = open
		isCodeView.value = codeViewDefault
	}

	/** Its editor closed: no page is open, so Save can't write what opens next over it. */
	const closePage = (closed: Editor) => {
		if (page.value?.editor !== closed) return
		page.value.closeNotSaved?.()
		page.value = null
		isCodeView.value = codeViewDefault
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

	// The page's writes. One the server refuses says why (config/queryClient.ts), except a content
	// save, whose refusal for a page saved elsewhere is a question instead (saveStored).
	const createPage = useMutation(
		{ mutationFn: (input: NewPage) => trpc.adminPages.create.mutate(input) },
		queryClient,
	)
	const saveContent = useMutation(
		{
			mutationFn: (input: ContentSave) => trpc.adminPages.save.mutate(input),
			meta: { showsOwnError: true },
		},
		queryClient,
	)

	// The version a save makes: above the one it's made from and every one sent for the page, so a
	// save sent again after one with no answer is taken, and that one arriving late isn't.
	const nextVersion = (open: OpenPage, madeFrom: number) => {
		open.sentVersion = Math.max(madeFrom, open.sentVersion) + 1
		return open.sentVersion
	}

	const savedElsewhere = (error: unknown) =>
		error instanceof TRPCClientError && error.data?.code === 'CONFLICT'

	// Saves a stored page's content; false if it isn't saved, and the author has been told. Refused
	// as the page was saved elsewhere after the version it opened or last saved, it asks whether to
	// save over that: from the page's version now, read first, so a save in between is refused too,
	// and asked about again.
	const saveStored = async (open: OpenPage, pageId: number, contentJson: string) => {
		const { slug } = open
		let madeFrom = open.version
		for (;;) {
			try {
				const saved = await saveContent.mutateAsync({
					pageId,
					contentJson,
					version: madeFrom,
					newVersion: nextVersion(open, madeFrom),
					savedFrom: open.savedFrom,
				})
				open.version = saved.version
				return true
			} catch (error) {
				if (!savedElsewhere(error)) throw error
			}
			const over = await showConfirm(
				'This page was saved somewhere else after you opened it. Save over that version with yours?',
				{ okText: 'Save over it' },
			)
			if (!over) {
				// Its Preview, read-only, so the page isn't edited in a third place.
				const other =
					slug && router.resolve({ name: 'page-preview', params: { slug } }).href
				open.closeNotSaved = notify({
					variant: 'warning',
					message: 'Not saved. Your edits are still here.',
					duration: 0,
					action: other
						? {
								label: 'Open the other version',
								onClick: () => window.open(other, '_blank'),
							}
						: undefined,
				})
				return false
			}
			const now = await trpc.adminPages.getWithTags.query({ pageId })
			if (!now) {
				notify({ variant: 'danger', message: 'This page has been deleted' })
				return false
			}
			madeFrom = now.version
		}
	}

	/** The save under way for the page open, its name question included, or null: leaving waits for it. */
	const saveUnderWay = () => page.value?.saving ?? null

	// A page given an address by its first save shows it, unless a Back or Forward the editor took
	// back is still landing: the address would take the place in the history of the page it went
	// to. It shows at the next save instead. The save ends once it shows, so a move waiting for
	// the save can't cancel it.
	const showAddress = async ({ slug }: OpenPage) => {
		const shown = router.currentRoute.value
		if (!slug || shown.params['slug'] === slug) return
		if (router.options.history.location !== shown.fullPath) return
		await router.replace({ name: 'editor-page', params: { slug } })
	}

	const save = async () => {
		const open = page.value
		if (!open) return
		open.closeNotSaved?.()
		open.closeNotSaved = null
		const run = saveNow(open)
		open.saving = run
		try {
			await run
		} finally {
			if (open.saving === run) open.saving = null
		}
	}

	// Saves the page open. If another opens while it saves (the address moved on), the save still
	// finishes, into the page it started on, which is no longer on screen.
	const saveNow = async (open: OpenPage) => {
		// What's saved is the page, with the code view's changes in it.
		const problem = isCodeView.value ? applyCode() : null
		if (problem) {
			codeProblem(`Not saved: ${problem}`)
			return
		}
		open.saveStatus = 'saving'
		// The page as it's sent: what's typed while it saves stays unsaved.
		const doc = open.editor.state.doc
		const json = open.editor.getJSON()
		const contentJson = JSON.stringify(
			json.content?.length ? json : { type: 'doc', content: [{ type: 'paragraph' }] },
		)
		try {
			if (open.pageId !== null) {
				if (!(await saveStored(open, open.pageId, contentJson))) {
					open.saveStatus = 'idle'
					return
				}
			} else {
				let name = open.name?.trim() || null
				if (!name) {
					name = await showPrompt('Page name')
					if (name === null) {
						open.saveStatus = 'idle'
						return
					}
				}
				// Made with its collection, in one write. With no answer it may have been made: Save
				// again saves that page, with this name, not asked again.
				const made = await createPage
					.mutateAsync({
						name,
						contentJson,
						tagIds: open.autoTag === null ? undefined : [open.autoTag],
						savedFrom: open.savedFrom,
						newVersion: nextVersion(open, 0),
					})
					.catch((error: unknown) => {
						if (noAnswer(error)) open.name = name
						throw error
					})
				if (!made?.pageId) throw new Error('Failed to create page: no ID returned')
				open.pageId = made.pageId
				open.slug = made.slug
				open.name = name
				open.savedName = name
				open.version = made.version
			}
			open.savedDoc = doc
			if (page.value === open) await showAddress(open)
			open.saveStatus = 'saved'
			setTimeout(() => {
				if (open.saveStatus === 'saved') open.saveStatus = 'idle'
			}, 2000)
			notify({
				duration: 2000,
				variant: 'success',
				message: 'Saved',
			})
		} catch (error) {
			open.saveStatus = 'error'
			setTimeout(() => {
				if (open.saveStatus === 'error') open.saveStatus = 'idle'
			}, 5000)
			// Once: a refused write other than a content save has said why already.
			notifyError(error)
		}
	}

	const rename = useMutation(
		{
			mutationFn: (input: { pageId: number; name: string }) =>
				trpc.adminPages.update.mutate(input),
		},
		queryClient,
	)

	// A new name shows at once; a page not saved yet keeps it for its first save. If the server
	// refuses it while it still shows, the name the server has comes back.
	const renamePage = (newName: string) => {
		const open = page.value
		const name = newName.trim()
		if (!open || !name) return
		open.name = name
		if (open.pageId === null) return
		void rename.mutateAsync({ pageId: open.pageId, name }).then(
			() => {
				open.savedName = name
			},
			() => {
				if (open.name === name) open.name = open.savedName
			},
		)
	}

	/**
	 * Whether the page on screen has edits Save would keep: whoever edits could save, and it differs
	 * from how it opened or was last saved (undoing back to that is no edit), or the code view holds
	 * code not yet put into it. Leaving asks first, and the top bar says so.
	 */
	const hasUnsavedChanges = computed(() => {
		const open = page.value
		if (!open || !couldSave.value) return false
		return !open.doc.eq(open.savedDoc) || (isCodeView.value && code.value !== pageCode.value)
	})

	return {
		page,
		editor,
		openPage,
		closePage,
		isCodeView,
		toggleCodeView,
		codeViewOpened,
		code,
		pageCode,
		couldSave,
		fetchPage,
		save,
		saveUnderWay,
		hasUnsavedChanges,
		renamePage,
	}
})
