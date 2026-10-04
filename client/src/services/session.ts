import { trpc } from '@/trpc'
import type { AppRouter } from '@somefreq-app/api/appRouter'
import type { inferRouterOutputs } from '@trpc/server'
import { computed, shallowRef } from 'vue'

// Who's signed in (docs/auth.md, "Client"). Our server holds the sign-in: the page only asks it
// who you are, and leaves for /auth/ to sign in or out. Every tab shares it (a cookie), so a new
// tab is signed in too. Plain functions, like toast.ts.

const current = shallowRef<inferRouterOutputs<AppRouter>['session']['get']>(null)

export const signedIn = computed(() => current.value !== null)
export const hasRole = (role: string) => current.value?.roles.includes(role) ?? false

let known: Promise<boolean> | undefined

/**
 * Settles once the server has said whether you're signed in: one question, asked at startup
 * (main.ts). Never rejects; false if there was no answer, which isn't the same as signed out (a
 * page that needs sign-in mustn't send you round to sign in again and again).
 */
export function whenSignInKnown(): Promise<boolean> {
	known ??= trpc.session.get.query().then(
		(answer) => {
			current.value = answer
			return true
		},
		(error) => {
			console.warn("Couldn't tell whether you're signed in:", error)
			return false
		},
	)
	return known
}

/**
 * Leaves the page to sign in, then comes back to `returnTo`. `recent`: you prove who you are again
 * unless you did in the last few minutes (before a sensitive change).
 */
export function signIn(returnTo: string, { recent = false } = {}) {
	const query = new URLSearchParams({ returnTo, ...(recent ? { recent: '1' } : {}) })
	location.assign(`/auth/login?${query}`)
}

/** Signs out here and at the provider, then home. A form, so it's a page load our server answers. */
export function signOut() {
	const form = document.createElement('form')
	form.method = 'post'
	form.action = '/auth/logout'
	document.body.appendChild(form)
	form.submit()
}

/** The server no longer knows you: your session ended (trpc.ts). */
export function signedOut() {
	current.value = null
}
