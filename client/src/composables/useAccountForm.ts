import { accountProfileKey, type AccountProfile } from '@/composables/useAccountProfile'
import { queryClient } from '@/config/queryClient'
import { errorMessage } from '@/services/errors'
import { trpc } from '@/trpc'
import { genderOptions, knownLanguage } from '@/utils/accountOptions'
import { useMutation } from '@tanstack/vue-query'
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

	// The form says itself why a save failed.
	const update = useMutation({
		mutationFn: (changes: Parameters<typeof trpc.account.updateProfile.mutate>[0]) =>
			trpc.account.updateProfile.mutate(changes),
		meta: { showsOwnError: true },
		onSuccess: () => queryClient.invalidateQueries({ queryKey: accountProfileKey }),
	})

	const saveSuccess = ref(false)
	const saveError = ref<string | null>(null)

	watch(form, () => {
		saveSuccess.value = false
		saveError.value = null
	})

	async function saveAccount() {
		saveSuccess.value = false
		saveError.value = null
		try {
			await update.mutateAsync({ ...form, gender: form.gender || null })
			saveSuccess.value = true
		} catch (error) {
			console.error('Profile save failed', error)
			saveError.value = errorMessage(error)
		}
	}

	return { form, saving: update.isPending, saveSuccess, saveError, saveAccount }
}
