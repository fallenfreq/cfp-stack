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
		<div class="sf-avatar sf-variant-featured sf-text-2xl w-16 h-16 shrink-0">
			{{ initials }}
		</div>
		<div class="sl-stack sf-gap-2xs">
			<h1 class="sf-heading-1">
				{{ profile.name || profile.preferred_username || 'Account' }}
			</h1>
			<p v-if="profile.preferred_username" class="sf-text-sm sf-loudness-1">
				@{{ profile.preferred_username }}
			</p>
		</div>
	</div>
</template>
