// Stand-in for '@/services/session'. The preview has no server to ask, so it shows the signed-in
// look (the account icon in the brand colour), as an admin.
import { computed } from 'vue'

export const signedIn = computed(() => true)
export const hasRole = () => true
export const whenSignInKnown = () => Promise.resolve(true)
// Signing in and out does nothing here.
const nothing = () => undefined
export const signIn = nothing
export const signOut = nothing
export const signedOut = nothing
