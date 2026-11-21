<template>
	<div class="sl-cover" style="--sl-cover-min: 20rem">
		<!-- What's given goes under the message: a way on from here. -->
		<div class="sl-stack sf-gap-sm">
			<p class="sf-loudness-1" :class="{ 'sf-variant-danger': state === 'error' }">
				{{ message ?? defaults[state] }}
			</p>
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ state: 'loading' | 'empty' | 'error'; message?: string }>()

const defaults = {
	loading: 'Loading…',
	empty: 'Nothing here.',
	error: 'Not found.',
}
</script>
