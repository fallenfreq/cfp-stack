import { notify } from '@/services/toast'
import type { AppRouter } from '@somefreq-app/api/appRouter'
import { TRPCClientError } from '@trpc/client'

// A field the server refused, named as the page labels it; any other goes by the input's own name.
const fieldNames: Record<string, string> = {
	name: 'Name',
	slug: 'Slug',
	title: 'Title',
	contentJson: 'Page content',
	tagIds: 'Tags',
	firstName: 'First name',
	lastName: 'Last name',
	displayName: 'Display name',
	nickname: 'Nickname',
	language: 'Preferred language',
	gender: 'Gender',
	email: 'New email address',
	code: 'Verification code',
}

// A call the server didn't answer: no answer from tRPC at all, or one from before it
// (api/functions_src/trpc/[[trpc]].ts).
export function noAnswer(error: unknown): boolean {
	return error instanceof TRPCClientError && !error.data
}

// A call whose connection dropped, which fetch reports as a TypeError: one kind of noAnswer, the
// time limit (trpc.ts) another.
export function connectionDropped(error: unknown): boolean {
	return error instanceof TRPCClientError && error.cause instanceof TypeError
}

// What an error says on the page: the one place a failed call to the server, or an error nothing
// else words, is put into words, where translations would go. The server sends only what's safe
// to show (api/src/config/trpc.ts): its refusals in words, a refused input's issues field by
// field, and "Internal Server Error" for anything else.
export function errorMessage(error: unknown): string {
	if (!(error instanceof TRPCClientError)) return 'Something went wrong. Please try again.'
	if (noAnswer(error)) return "Couldn't get an answer from the server. Please try again."
	const { data } = error as TRPCClientError<AppRouter>
	if (data?.code === 'INTERNAL_SERVER_ERROR')
		return 'Something went wrong on our side. Please try again.'
	if (data?.zodError) {
		const { formErrors, fieldErrors } = data.zodError
		// Keyed by the input's fields, which the server's type can't name for every route.
		const fields = Object.entries<string[] | undefined>(fieldErrors).flatMap(
			([field, messages]) =>
				(messages ?? []).map((message) => `${fieldNames[field] ?? field}: ${message}`),
		)
		return [...formErrors, ...fields].join('\n')
	}
	return error.message
}

// Errors already shown: a failed write passed on by its caller (the editor's Save), or code that
// couldn't load passed on by the router, isn't shown again.
const shown = new WeakSet<object>()

// Code the site needs that couldn't load (Vite's event, main.ts): after a deploy, or the network.
// A refresh loads the newest version; it's never done by itself, so the editor asks first about
// unsaved edits (client/README.md, "New versions"). Shown once: a new page made from the list
// that then can't open mustn't also say "Something went wrong. Please try again.", which would
// make it twice.
export function notifyNotLoaded(error: unknown): void {
	if (typeof error === 'object' && error !== null) shown.add(error)
	console.error(error)
	notify({
		message: "This page couldn't load. Refresh to try again.",
		variant: 'warning',
		duration: 0,
		action: { label: 'Refresh', onClick: () => location.reload() },
	})
}

// An error in a toast, and in full in the console: a read or a write that failed
// (config/queryClient.ts), what a component's code didn't catch and a promise of ours that failed
// with nothing waiting on it (main.ts).
export function notifyError(error: unknown): void {
	if (typeof error === 'object' && error !== null) {
		if (shown.has(error)) return
		shown.add(error)
	}
	console.error(error)
	notify({ message: errorMessage(error), variant: 'danger' })
}
