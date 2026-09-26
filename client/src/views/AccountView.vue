<script lang="ts" setup>
import AccountDetailsCard from '@/components/account/AccountDetailsCard.vue'
import AccountHeader from '@/components/account/AccountHeader.vue'
import EmailChangeCard from '@/components/account/EmailChangeCard.vue'
import { useZitadelProfile } from '@/composables/useZitadelProfile'

const profile = useZitadelProfile()
</script>

<template>
	<SfStatusDisplay v-if="profile === null" state="error" message="Unable to load account data." />
	<SfPageShell v-else>
		<template #header>
			<AccountHeader :profile="profile" />
		</template>
		<AccountDetailsCard :profile="profile" />
		<EmailChangeCard :profile="profile" />
	</SfPageShell>
</template>
