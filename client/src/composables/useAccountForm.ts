import { accountProfileKey, refusalOf, type AccountProfile } from '@/composables/useAccountProfile'
import { queryClient } from '@/config/queryClient'
import { trpc } from '@/trpc'
import { genderOptions, knownLanguage } from '@/utils/accountOptions'
import { TRPCClientError } from '@trpc/client'
import { reactive, ref, watch, type Ref } from 'vue'

type GenderChoice = (typeof genderOptions)[number]['value']

export function useAccountForm(profile: Ref<AccountProfile>) {
	const form = reactive({
		firstName: '',
		lastName: '',
		displayName: '',
		nickname: '',
		language: '',
		gender: '' as GenderChoice,
	})

	watch(
		profile,
		(saved) => {
			form.firstName = saved.firstName
			form.lastName = saved.lastName
			form.displayName = saved.displayName
			form.nickname = saved.nickname
			form.language = knownLanguage(saved.language)
			form.gender = saved.gender ?? ''
		},
		{ immediate: true },
	)

	const saving = ref(false)
	const saveSuccess = ref(false)
	const saveError = ref<string | null>(null)

	watch(form, () => {
		saveSuccess.value = false
		saveError.value = null
	})

	async function saveAccount() {
		saving.value = true
		saveSuccess.value = false
		saveError.value = null
		try {
			await trpc.account.updateProfile.mutate({ ...form, gender: form.gender || null })
			await queryClient.invalidateQueries({ queryKey: accountProfileKey })
			saveSuccess.value = true
		} catch (error) {
			console.error('Profile save failed', error)
			saveError.value =
				refusalOf(error)
				?? (error instanceof TRPCClientError && error.data?.code === 'BAD_REQUEST'
					? "Your profile wasn't saved: check its fields."
					: 'Failed to save profile. Please try again.')
		} finally {
			saving.value = false
		}
	}

	return { form, saving, saveSuccess, saveError, saveAccount }
}
