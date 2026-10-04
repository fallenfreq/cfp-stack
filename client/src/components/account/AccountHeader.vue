<script lang="ts" setup>
import { type AccountProfile } from '@/composables/useAccountProfile'
import { computed } from 'vue'

const props = defineProps<{ profile: AccountProfile }>()

const initials = computed(() => {
	const first = props.profile.firstName[0] ?? ''
	const last = props.profile.lastName[0] ?? ''
	const combined = (first + last).toUpperCase()
	return combined || props.profile.displayName[0]?.toUpperCase() || '?'
})
</script>

<template>
	<div class="sl-cluster sf-gap-md">
		<!-- The initials repeat the name beside them. -->
		<div class="account-avatar sf-avatar sf-text-2xl" aria-hidden="true">
			{{ initials }}
		</div>
		<div class="sl-stack sf-gap-2xs">
			<h1 class="sf-heading-1">
				{{ profile.displayName || profile.username || 'Account' }}
			</h1>
			<p v-if="profile.username" class="sf-text-sm sf-loudness-1">@{{ profile.username }}</p>
			<p class="sf-text-sm sf-loudness-1">User ID: {{ profile.userId }}</p>
		</div>
	</div>
</template>

<style scoped>
@layer ui {
	/* Sized from its own letters, so it keeps its proportions with the text size. */
	.account-avatar {
		width: 2.5em;
		height: 2.5em;
		flex-shrink: 0;
	}
}
</style>
