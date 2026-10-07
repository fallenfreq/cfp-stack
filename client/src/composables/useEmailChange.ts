import { accountProfileKey, type AccountProfile } from '@/composables/useAccountProfile'
import { queryClient } from '@/config/queryClient'
import { errorMessage } from '@/services/errors'
import { signIn } from '@/services/session'
import { trpc } from '@/trpc'
import { useMutation } from '@tanstack/vue-query'
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

	// The card says itself why a step failed.
	const meta = { showsOwnError: true }
	const changeEmail = useMutation({
		mutationFn: (email: string) => trpc.account.changeEmail.mutate({ email }),
		meta,
	})
	const verifyEmail = useMutation({
		mutationFn: (code: string) => trpc.account.verifyEmail.mutate({ code }),
		meta,
	})
	const resendCode = useMutation({
		mutationFn: () => trpc.account.resendEmailCode.mutate(),
		meta,
	})

	async function requestEmailChange() {
		if (newEmail.value !== confirmEmail.value) {
			emailError.value = 'Email addresses do not match'
			return
		}
		emailStatus.value = 'sending'
		emailError.value = null
		const submittedEmail = newEmail.value
		try {
			await changeEmail.mutateAsync(submittedEmail)
			pendingEmail.value = submittedEmail
			sessionStorage.setItem(PENDING_EMAIL_KEY, submittedEmail)
			newEmail.value = ''
			emailStatus.value = 'code'
		} catch (error) {
			if (error instanceof TRPCClientError && error.data?.code === 'PRECONDITION_FAILED') {
				emailStatus.value = 'confirm'
				return
			}
			emailError.value = errorMessage(error)
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
			await verifyEmail.mutateAsync(verificationCode.value)
			sessionStorage.removeItem(PENDING_EMAIL_KEY)
			verificationCode.value = ''
			emailStatus.value = 'done'
			await queryClient.invalidateQueries({ queryKey: accountProfileKey })
		} catch (error) {
			emailError.value = errorMessage(error)
			emailStatus.value = 'code'
		}
	}

	async function resendEmailCode() {
		emailError.value = null
		resendSent.value = false
		try {
			await resendCode.mutateAsync()
			resendSent.value = true
		} catch (error) {
			emailError.value = errorMessage(error)
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
