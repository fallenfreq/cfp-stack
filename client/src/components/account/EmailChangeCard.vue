<script lang="ts" setup>
import { useEmailChange } from '@/composables/useEmailChange'
import { type ZitadelProfile } from '@/composables/useZitadelProfile'
import { computed } from 'vue'

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

const mismatch = computed(() => !!confirmEmail.value && newEmail.value !== confirmEmail.value)
// Each button's disabled state and its hover read from one value.
const canRequest = computed(
	() =>
		emailStatus.value !== 'sending'
		&& !!newEmail.value
		&& newEmail.value === confirmEmail.value,
)
const canVerify = computed(() => emailStatus.value !== 'verifying' && !!verificationCode.value)
</script>

<template>
	<section class="sf-depth-1 sl-stack sf-gap-md">
		<h2 class="sf-heading-2">Email</h2>
		<div class="sl-cluster sf-gap-sm">
			<span>{{ profile.email }}</span>
			<span
				v-if="profile.email_verified"
				class="sf-status sf-single-line sf-size-2xs sf-loudness-3 sf-variant-success"
			>
				Verified
			</span>
			<span
				v-else
				class="sf-status sf-single-line sf-size-2xs sf-loudness-3 sf-variant-warning"
			>
				Unverified
			</span>
		</div>

		<template v-if="emailStatus === 'idle' || emailStatus === 'sending'">
			<div class="sl-columns sl-collapse-sm sf-gap-sm">
				<label class="sl-stack sf-gap-2xs">
					<span class="sf-text-sm">New email address</span>
					<input v-model="newEmail" type="email" class="sf sf-field sf-on-focus" />
				</label>
				<label class="sl-stack sf-gap-2xs">
					<span class="sf-text-sm">Confirm new email address</span>
					<input
						v-model="confirmEmail"
						type="email"
						class="sf sf-field sf-on-focus"
						:class="{ 'sf-is-error': mismatch }"
						:aria-invalid="mismatch"
					/>
					<span v-if="mismatch" class="sf-text-sm sf-variant-danger">
						Addresses do not match
					</span>
				</label>
			</div>
			<p
				v-if="newEmail && newEmail === confirmEmail"
				class="sf-depth-1 sf-loudness-2 sf-variant-warning sf-text-sm"
			>
				This change takes effect immediately. If you cannot access the verification email
				sent to {{ newEmail }}, you will be locked out until an admin resets your address.
			</p>
			<div class="sl-cluster sf-gap-sm">
				<SfButton
					:loudness="3"
					variant="primary"
					:loading="emailStatus === 'sending'"
					:disabled="!canRequest"
					@click="requestEmailChange"
				>
					{{ emailStatus === 'sending' ? 'Sending…' : 'Request change' }}
				</SfButton>
			</div>
			<p v-if="emailError" class="sf-text-sm sf-variant-danger" role="alert">
				{{ emailError }}
			</p>
		</template>

		<template v-else-if="emailStatus === 'code' || emailStatus === 'verifying'">
			<p class="sf-text-sm sf-loudness-1">
				A verification code has been sent to <strong>{{ pendingEmail }}</strong
				>. Your current email remains active until you verify the new one.
			</p>
			<div class="sl-cluster sl-align-y-end sf-gap-sm">
				<label class="code-field sl-stack sf-gap-2xs">
					<span class="sf-text-sm">Verification code</span>
					<input
						v-model="verificationCode"
						class="sf sf-field sf-on-focus"
						autocomplete="one-time-code"
					/>
				</label>
				<SfButton
					:loudness="3"
					variant="primary"
					:loading="emailStatus === 'verifying'"
					:disabled="!canVerify"
					@click="verifyEmailCode"
				>
					{{ emailStatus === 'verifying' ? 'Verifying…' : 'Verify' }}
				</SfButton>
				<SfButton :loudness="2" @click="cancelEmailChange"> Cancel </SfButton>
			</div>
			<div class="sl-cluster sl-align-y-center sf-gap-sm">
				<SfButton :loudness="2" size="xs" @click="resendEmailCode"> Resend code </SfButton>
				<span v-if="resendSent" class="sf-text-sm sf-variant-success" role="status">
					Code resent to {{ pendingEmail }}
				</span>
			</div>
			<p v-if="emailError" class="sf-text-sm sf-variant-danger" role="alert">
				{{ emailError }}
			</p>
		</template>

		<div v-else-if="emailStatus === 'done'" class="sl-cluster sl-align-y-center sf-gap-sm">
			<p class="sf-text-sm sf-variant-success" role="status">
				Email updated to {{ pendingEmail }}. Sign out and back in to see the change
				reflected here.
			</p>
			<SfButton :loudness="2" size="xs" @click="cancelEmailChange"> Change again </SfButton>
		</div>
	</section>
</template>

<style scoped>
@layer ui {
	/* The code field takes the row's spare space; the buttons sit beside it until the
	   row is too narrow, then wrap below. */
	.code-field {
		flex: 1;
		min-width: 12rem;
	}
}
</style>
