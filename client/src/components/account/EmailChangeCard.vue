<script lang="ts" setup>
import { useEmailChange } from '@/composables/useEmailChange'
import { type ZitadelProfile } from '@/composables/useZitadelProfile'

const props = defineProps<{ profile: ZitadelProfile }>()
const {
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
} = useEmailChange(props.profile)
</script>

<template>
	<VaCard class="p-6">
		<h2 class="text-xl font-semibold mb-5">Email</h2>
		<div class="flex items-center gap-3 mb-5">
			<span>{{ profile.email }}</span>
			<VaBadge v-if="profile.email_verified" text="Verified" color="success" />
			<VaBadge v-else text="Unverified" color="warning" />
		</div>

		<template v-if="emailStatus === 'idle' || emailStatus === 'sending'">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
				<VaInput v-model="newEmail" label="New email address" type="email" />
				<VaInput
					v-model="confirmEmail"
					label="Confirm new email address"
					type="email"
					:error="!!confirmEmail && newEmail !== confirmEmail"
					error-messages="Addresses do not match"
				/>
			</div>
			<p
				v-if="newEmail && newEmail === confirmEmail"
				class="text-sm mb-3 p-3 rounded"
				style="
					background: color-mix(in srgb, var(--va-warning) 15%, transparent);
					color: var(--va-warning);
				"
			>
				This change takes effect immediately. If you cannot access the verification email
				sent to
				{{ newEmail }}, you will be locked out until an admin resets your address.
			</p>
			<VaButton
				:loading="emailStatus === 'sending'"
				:disabled="!newEmail || newEmail !== confirmEmail"
				@click="requestEmailChange"
			>
				Request change
			</VaButton>
			<p v-if="emailError" class="text-sm mt-3" style="color: var(--va-danger)">
				{{ emailError }}
			</p>
		</template>

		<template v-else-if="emailStatus === 'code' || emailStatus === 'verifying'">
			<p class="text-sm mb-4" style="opacity: 0.8">
				A verification code has been sent to <strong>{{ pendingEmail }}</strong>. Your current email remains active until you verify the new one.
			</p>
			<div class="flex flex-wrap gap-3 items-end">
				<VaInput
					v-model="verificationCode"
					label="Verification code"
					class="flex-1 min-w-48"
				/>
				<VaButton
					:loading="emailStatus === 'verifying'"
					:disabled="!verificationCode"
					@click="verifyEmailCode"
				>
					Verify
				</VaButton>
				<VaButton preset="secondary" @click="cancelEmailChange">Cancel</VaButton>
			</div>
			<div class="flex items-center gap-3 mt-3">
				<VaButton preset="plain" size="small" @click="resendEmailCode">
					Resend code
				</VaButton>
				<span v-if="resendSent" class="text-sm" style="color: var(--va-success)">
					Code resent to {{ pendingEmail }}
				</span>
			</div>
			<p v-if="emailError" class="text-sm mt-2" style="color: var(--va-danger)">
				{{ emailError }}
			</p>
		</template>

		<div v-else-if="emailStatus === 'done'" class="flex items-center gap-4">
			<p class="text-sm" style="color: var(--va-success)">
				Email updated to {{ pendingEmail }}. Sign out and back in to see the change
				reflected here.
			</p>
			<VaButton preset="secondary" size="small" @click="cancelEmailChange">
				Change again
			</VaButton>
		</div>
	</VaCard>
</template>
