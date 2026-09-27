<script lang="ts" setup>
import { useAccountForm } from '@/composables/useAccountForm'
import { type ZitadelProfile } from '@/composables/useZitadelProfile'
import { genderOptions, languageOptions } from '@/utils/zitadelOptions'
import { toRef } from 'vue'

const props = defineProps<{ profile: ZitadelProfile }>()
const { form, saving, saveSuccess, saveError, saveWarning, saveAccount } = useAccountForm(
	toRef(props, 'profile'),
)
</script>

<template>
	<section class="sf-depth-1 sl-stack sf-gap-md">
		<h2 class="sf-heading-2">Account</h2>
		<div
			class="sl-columns sl-collapse-sm sf-gap-sm"
			style="--sl-cols: repeat(2, minmax(0, 1fr))"
		>
			<label class="sl-stack sf-gap-2xs">
				<span class="sf-text-sm">First name</span>
				<input v-model="form.firstName" class="sf sf-field sf-on-focus">
			</label>
			<label class="sl-stack sf-gap-2xs">
				<span class="sf-text-sm">Last name</span>
				<input v-model="form.lastName" class="sf sf-field sf-on-focus">
			</label>
			<label class="sl-stack sf-gap-2xs">
				<span class="sf-text-sm">Display name</span>
				<input v-model="form.displayName" class="sf sf-field sf-on-focus">
			</label>
			<label class="sl-stack sf-gap-2xs">
				<span class="sf-text-sm">Nickname</span>
				<input v-model="form.nickName" class="sf sf-field sf-on-focus">
			</label>
			<label class="sl-stack sf-gap-2xs">
				<span class="sf-text-sm">Preferred language</span>
				<select v-model="form.preferredLanguage" class="sf sf-field sf-on-focus">
					<option v-for="o in languageOptions" :key="o.value" :value="o.value">
						{{ o.text }}
					</option>
				</select>
			</label>
			<label class="sl-stack sf-gap-2xs">
				<span class="sf-text-sm">Gender</span>
				<select v-model="form.gender" class="sf sf-field sf-on-focus">
					<option v-for="o in genderOptions" :key="o.value" :value="o.value">
						{{ o.text }}
					</option>
				</select>
			</label>
		</div>
		<div class="sl-cluster sl-align-y-center sf-gap-sm">
			<button
				type="button"
				class="sf sf-loudness-3 sf-variant-primary sf-on-disabled"
				:class="{ 'sf-is-loading': saving, 'sf-on-hover': !saving }"
				:aria-busy="saving"
				:disabled="saving"
				@click="saveAccount"
			>
				{{ saving ? 'Saving…' : 'Save' }}
			</button>
			<span
				v-if="saveSuccess && !saveWarning"
				class="sf-text-sm sf-variant-success"
				role="status"
			>
				Saved successfully
			</span>
			<span v-if="saveWarning" class="sf-text-sm sf-variant-warning" role="status">
				{{ saveWarning }}
			</span>
			<span v-if="saveError" class="sf-text-sm sf-variant-danger" role="alert">
				{{ saveError }}
			</span>
		</div>
	</section>
</template>
