import { accountProfileKey, refusalOf, type AccountProfile } from '@/composables/useAccountProfile'
import { queryClient } from '@/config/queryClient'
import { signIn } from '@/services/session'
import { trpc } from '@/trpc'
import { TRPCClientError } from '@trpc/client'
import { ref } from 'vue'

export function useEmailChange(profile: AccountProfile) {
	const PENDING_EMAIL_KEY = `cfp_pending_email_${profile.userId}`

	const stored = sessionStorage.getItem(PENDING_EMAIL_KEY)
	const newEmail = ref('')
	const confirmEmail = ref('')
	const pendingEmail = ref(stored ?? '')
	const verificationCode = ref('')
	// 'confirm': the change needs a recent sign-in first.
	const emailStatus = ref<'idle' | 'sending' | 'confirm' | 'code' | 'verifying' | 'done'>(
		stored ? 'code' : 'idle',
	)
	const emailError = ref<string | null>(null)
	const resendSent = ref(false)

	async function requestEmailChange() {
		if (newEmail.value !== confirmEmail.value) {
			emailError.value = 'Email addresses do not match'
			return
		}
		emailStatus.value = 'sending'
		emailError.value = null
		const submittedEmail = newEmail.value
		try {
			await trpc.account.changeEmail.mutate({ email: submittedEmail })
			pendingEmail.value = submittedEmail
			sessionStorage.setItem(PENDING_EMAIL_KEY, submittedEmail)
			newEmail.value = ''
			emailStatus.value = 'code'
		} catch (error) {
			if (error instanceof TRPCClientError && error.data?.code === 'PRECONDITION_FAILED') {
				emailStatus.value = 'confirm'
				return
			}
			emailError.value =
				refusalOf(error) ?? 'Failed to request email change. Please try again.'
			emailStatus.value = 'idle'
		}
	}

	// Signs in again (the password, unless you did in the last few minutes), back to this page.
	function confirmIdentity() {
		signIn('/account', { recent: true })
	}

	async function verifyEmailCode() {
		emailStatus.value = 'verifying'
		emailError.value = null
		try {
			await trpc.account.verifyEmail.mutate({ code: verificationCode.value })
			sessionStorage.removeItem(PENDING_EMAIL_KEY)
			verificationCode.value = ''
			emailStatus.value = 'done'
			await queryClient.invalidateQueries({ queryKey: accountProfileKey })
		} catch (error) {
			emailError.value = refusalOf(error) ?? "The code couldn't be checked. Please try again."
			emailStatus.value = 'code'
		}
	}

	async function resendEmailCode() {
		emailError.value = null
		resendSent.value = false
		try {
			await trpc.account.resendEmailCode.mutate()
			resendSent.value = true
		} catch (error) {
			emailError.value = refusalOf(error) ?? 'Failed to resend code. Please try again.'
		}
	}

	function cancelEmailChange() {
		sessionStorage.removeItem(PENDING_EMAIL_KEY)
		emailStatus.value = 'idle'
		emailError.value = null
		resendSent.value = false
		newEmail.value = ''
		confirmEmail.value = ''
		verificationCode.value = ''
		pendingEmail.value = ''
	}

	return {
		newEmail,
		confirmEmail,
		pendingEmail,
		verificationCode,
		emailStatus,
		emailError,
		resendSent,
		requestEmailChange,
		confirmIdentity,
		verifyEmailCode,
		resendEmailCode,
		cancelEmailChange,
	}
}
