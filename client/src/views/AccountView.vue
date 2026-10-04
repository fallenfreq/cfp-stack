<script lang="ts" setup>
import AccountDetailsCard from '@/components/account/AccountDetailsCard.vue'
import AccountHeader from '@/components/account/AccountHeader.vue'
import EmailChangeCard from '@/components/account/EmailChangeCard.vue'
import { useAccountProfile } from '@/composables/useAccountProfile'

const { data: profile, isPending } = useAccountProfile()
</script>

<template>
	<SfStatusDisplay v-if="isPending" state="loading" />
	<SfStatusDisplay v-else-if="!profile" state="error" message="Unable to load account data." />
	<SfPageShell v-else>
		<template #header>
			<AccountHeader :profile="profile" />
		</template>
		<AccountDetailsCard :profile="profile" />
		<EmailChangeCard :profile="profile" />
	</SfPageShell>
</template>
