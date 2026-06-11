import zitadelAuth from '@/services/zitadelAuth'
import axios from 'axios'
import { ref } from 'vue'
import { type ZitadelProfile } from './useZitadelProfile'

export function useEmailChange(profile: ZitadelProfile) {
	const PENDING_EMAIL_KEY = `cfp_pending_email_${profile.sub}`

	const stored = sessionStorage.getItem(PENDING_EMAIL_KEY)
	const newEmail = ref('')
	const confirmEmail = ref('')
	const pendingEmail = ref(stored ?? '')
	const verificationCode = ref('')
	const emailStatus = ref<'idle' | 'sending' | 'code' | 'verifying' | 'done'>(
		stored ? 'code' : 'idle',
	)
	const emailError = ref<string | null>(null)
	const resendSent = ref(false)

	async function requestEmailChange() {
		if (newEmail.value !== confirmEmail.value) {
			emailError.value = 'Email addresses do not match'
			return
		}
		const token = zitadelAuth.oidcAuth.accessToken
		if (!token) {
			emailError.value = 'No access token — try signing out and back in'
			return
		}
		emailStatus.value = 'sending'
		emailError.value = null
		const submittedEmail = newEmail.value
		try {
			await axios.post(
				`${import.meta.env.VITE_API_ZITADEL_ISSUER}v2/users/${profile.sub}/email`,
				{ email: submittedEmail, sendCode: {} },
				{ headers: { Authorization: `Bearer ${token}` } },
			)
			pendingEmail.value = submittedEmail
			sessionStorage.setItem(PENDING_EMAIL_KEY, submittedEmail)
			newEmail.value = ''
			emailStatus.value = 'code'
		} catch {
			emailError.value = 'Failed to request email change. Please try again.'
			emailStatus.value = 'idle'
		}
	}

	async function verifyEmailCode() {
		const token = zitadelAuth.oidcAuth.accessToken
		if (!token) {
			emailError.value = 'No access token — try signing out and back in'
			return
		}
		emailStatus.value = 'verifying'
		emailError.value = null
		try {
			await axios.post(
				`${import.meta.env.VITE_API_ZITADEL_ISSUER}v2/users/${profile.sub}/email/verify`,
				{ verificationCode: verificationCode.value },
				{ headers: { Authorization: `Bearer ${token}` } },
			)
			sessionStorage.removeItem(PENDING_EMAIL_KEY)
			verificationCode.value = ''
			emailStatus.value = 'done'
			try {
				await zitadelAuth.oidcAuth.mgr.signinSilent()
			} catch {
				// Profile refresh is best-effort
			}
		} catch {
			emailError.value = 'Invalid or expired code. Please check and try again.'
			emailStatus.value = 'code'
		}
	}

	async function resendEmailCode() {
		const token = zitadelAuth.oidcAuth.accessToken
		if (!token) return
		emailError.value = null
		resendSent.value = false
		try {
			await axios.post(
				`${import.meta.env.VITE_API_ZITADEL_ISSUER}v2/users/${profile.sub}/email/resend`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } },
			)
			resendSent.value = true
		} catch {
			emailError.value = 'Failed to resend code. Please try again.'
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
		verifyEmailCode,
		resendEmailCode,
		cancelEmailChange,
	}
}
