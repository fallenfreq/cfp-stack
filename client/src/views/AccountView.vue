<script lang="ts" setup>
import AccountHeader from '@/components/account/AccountHeader.vue'
import EmailChangeCard from '@/components/account/EmailChangeCard.vue'
import { useAccountForm } from '@/composables/useAccountForm'
import { useZitadelProfile } from '@/composables/useZitadelProfile'
import { genderOptions, languageOptions } from '@/utils/zitadelOptions'

const profile = useZitadelProfile()
const { form, saving, saveSuccess, saveError, saveWarning, saveAccount } = useAccountForm(profile)
</script>

<template>
	<div class="flex flex-col w-full max-w-5xl mx-auto px-6 pt-5">
		<div v-if="profile === null" class="text-lg" style="opacity: 0.6">
			Unable to load account data.
		</div>

		<template v-else>
			<AccountHeader :profile="profile" />

			<div class="flex flex-wrap gap-6 mb-8 text-sm" style="opacity: 0.6">
				<span><span class="font-medium">User ID: </span>{{ profile.sub }}</span>
			</div>

			<VaCard class="mb-6 p-6">
				<h2 class="text-xl font-semibold mb-5">Account</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<VaInput v-model="form.firstName" label="First name" />
					<VaInput v-model="form.lastName" label="Last name" />
					<VaInput v-model="form.displayName" label="Display name" />
					<VaInput v-model="form.nickName" label="Nickname" />
					<VaSelect
						v-model="form.preferredLanguage"
						label="Preferred language"
						:options="languageOptions"
						text-by="text"
						value-by="value"
					/>
					<VaSelect
						v-model="form.gender"
						label="Gender"
						:options="genderOptions"
						text-by="text"
						value-by="value"
					/>
				</div>
				<div class="flex items-center gap-4 mt-5">
					<VaButton :loading="saving" @click="saveAccount">Save</VaButton>
					<span
						v-if="saveSuccess && !saveWarning"
						class="text-sm"
						style="color: var(--va-success)"
					>
						Saved successfully
					</span>
					<span v-if="saveWarning" class="text-sm" style="color: var(--va-warning)">
						{{ saveWarning }}
					</span>
					<span v-if="saveError" class="text-sm" style="color: var(--va-danger)">
						{{ saveError }}
					</span>
				</div>
			</VaCard>

			<EmailChangeCard :profile="profile" />
		</template>
	</div>
</template>
