import zitadelAuth from '@/services/zitadelAuth'
import { normalizeLocale } from '@/utils/zitadelOptions'
import axios from 'axios'
import { reactive, ref, watch, type Ref } from 'vue'
import { type ZitadelProfile } from './useZitadelProfile'

export function useProfileForm(profile: Ref<ZitadelProfile | null>) {
	const form = reactive({
		firstName: '',
		lastName: '',
		displayName: '',
		nickName: '',
		preferredLanguage: '',
		gender: '',
	})

	watch(
		profile,
		(newProfile) => {
			if (!newProfile) return
			form.firstName = newProfile.given_name ?? ''
			form.lastName = newProfile.family_name ?? ''
			form.displayName = newProfile.name ?? ''
			form.nickName = newProfile.nickname ?? ''
			form.preferredLanguage = normalizeLocale(newProfile.locale ?? '')
			form.gender = newProfile.gender ?? ''
		},
		{ immediate: true },
	)

	const saving = ref(false)
	const saveSuccess = ref(false)
	const saveError = ref<string | null>(null)
	const saveWarning = ref<string | null>(null)

	watch(form, () => {
		saveSuccess.value = false
		saveError.value = null
		saveWarning.value = null
	})

	async function saveProfile() {
		saving.value = true
		saveSuccess.value = false
		saveError.value = null
		saveWarning.value = null
		const token = zitadelAuth.oidcAuth.accessToken
		if (!token) {
			saveError.value = 'No access token — try signing out and back in'
			saving.value = false
			return
		}
		try {
			await axios.put(
				`${import.meta.env.VITE_API_ZITADEL_ISSUER}auth/v1/users/me/profile`,
				{
					firstName: form.firstName,
					lastName: form.lastName,
					nickName: form.nickName,
					displayName: form.displayName,
					preferredLanguage: form.preferredLanguage,
					gender: form.gender || 'GENDER_UNSPECIFIED',
				},
				{ headers: { Authorization: `Bearer ${token}` } },
			)
			try {
				await zitadelAuth.oidcAuth.mgr.signinSilent()
			} catch (renewErr) {
				console.warn('Silent renew after profile save failed:', renewErr)
				saveWarning.value = 'Saved — sign out and back in for changes to appear on refresh'
			}
			saveSuccess.value = true
		} catch (err) {
			if (axios.isAxiosError(err)) {
				console.error('Profile save failed', err.response?.status, err.response?.data)
				saveError.value = `Save failed (${err.response?.status ?? 'network error'}) — please try again`
			} else {
				console.error('Profile save failed', err)
				saveError.value = 'Failed to save profile. Please try again.'
			}
		} finally {
			saving.value = false
		}
	}

	return { form, saving, saveSuccess, saveError, saveWarning, saveProfile }
}
