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
	<div class="flex items-center gap-5 mb-8">
		<div
			class="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-on-primary text-2xl font-bold shrink-0"
		>
			{{ initials }}
		</div>
		<div>
			<h1 class="text-4xl font-bold">
				{{ profile.name || profile.preferred_username || 'Account' }}
			</h1>
			<p v-if="profile.preferred_username" class="text-sm mt-1" style="opacity: 0.6">
				@{{ profile.preferred_username }}
			</p>
		</div>
	</div>
</template>
