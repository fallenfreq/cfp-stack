<script lang="ts" setup>
import { type ZitadelProfile } from '@/composables/useZitadelProfile'
import { computed } from 'vue'

const props = defineProps<{ profile: ZitadelProfile }>()

const initials = computed(() => {
	const first = props.profile.given_name?.[0] ?? ''
	const last = props.profile.family_name?.[0] ?? ''
	const combined = (first + last).toUpperCase()
	return combined || props.profile.name?.[0]?.toUpperCase() || '?'
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
				{{ profile.name || profile.preferred_username || 'Account' }}
			</h1>
			<p v-if="profile.preferred_username" class="sf-text-sm sf-loudness-1">
				@{{ profile.preferred_username }}
			</p>
			<p class="sf-text-sm sf-loudness-1">User ID: {{ profile.sub }}</p>
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
