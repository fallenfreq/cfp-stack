import { accountProfileKey, type AccountProfile } from '@/composables/useAccountProfile'
import { queryClient } from '@/config/queryClient'
import { errorMessage } from '@/services/errors'
import { trpc } from '@/trpc'
import { genderOptions, knownLanguage } from '@/utils/accountOptions'
import { useMutation } from '@tanstack/vue-query'
import { reactive, ref, watch, type Ref } from 'vue'

type GenderChoice = (typeof genderOptions)[number]['value']
type ProfileChanges = Parameters<typeof trpc.account.updateProfile.mutate>[0]

// The profile as the form shows it.
interface AccountForm {
	firstName: string
	lastName: string
	displayName: string
	nickname: string
	language: string
	gender: GenderChoice
}
const asForm = (saved: AccountProfile): AccountForm => ({
	firstName: saved.firstName,
	lastName: saved.lastName,
	displayName: saved.displayName,
	nickname: saved.nickname,
	language: knownLanguage(saved.language),
	gender: saved.gender ?? '',
})

// Each field still as it was loaded takes the newly loaded value.
function takeUnedited<T extends object>(form: T, loaded: T, reloaded: T) {
	for (const field in reloaded) if (form[field] === loaded[field]) form[field] = reloaded[field]
}

export function useAccountForm(profile: Ref<AccountProfile>) {
	const form = reactive(asForm(profile.value))
	// A reload changes only the fields not being edited: what's typed meanwhile stays.
	watch(profile, (saved, before) => takeUnedited(form, asForm(before), asForm(saved)))

	// Only the fields changed, so a form open from before doesn't put back what was changed elsewhere
	// since, nor clear a language it doesn't offer (docs/database.md, "A write sends only what
	// changed").
	const changes = (): ProfileChanges => {
		const loaded = asForm(profile.value)
		const changed: ProfileChanges = {}
		if (form.firstName !== loaded.firstName) changed.firstName = form.firstName
		if (form.lastName !== loaded.lastName) changed.lastName = form.lastName
		if (form.displayName !== loaded.displayName) changed.displayName = form.displayName
		if (form.nickname !== loaded.nickname) changed.nickname = form.nickname
		if (form.language !== loaded.language) changed.language = form.language
		if (form.gender !== loaded.gender) changed.gender = form.gender || null
		return changed
	}

	// The form says itself why a save failed.
	const update = useMutation({
		mutationFn: (changed: ProfileChanges) => trpc.account.updateProfile.mutate(changed),
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
			await update.mutateAsync(changes())
			saveSuccess.value = true
		} catch (error) {
			console.error('Profile save failed', error)
			saveError.value = errorMessage(error)
		}
	}

	return { form, saving: update.isPending, saveSuccess, saveError, saveAccount }
}
