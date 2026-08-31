<template>
	<footer class="basic-footer sl-stack sf-gap-md sf-boundary-top">
		<small class="sf-text-sm sf-loudness-1">
			&copy; {{ year }} somefreq. All rights reserved.
		</small>
		<div class="sl-cluster sf-gap-md">
			<!-- <FontAwesomeIcon :icon="faFacebook" class="cursor-pointer" /> -->
			<a
				href="https://github.com/fallenfreq"
				target="_blank"
				rel="noopener noreferrer nofollow"
			>
				<FontAwesomeIcon size="xl" :icon="faGithub" />
			</a>
			<!-- <FontAwesomeIcon :icon="faInstagram" class="cursor-pointer" /> -->
		</div>
		<DarkModeSwitch />
	</footer>
</template>

<script setup lang="ts">
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const year = new Date().getFullYear()
// import { faFacebook } from '@fortawesome/free-brands-svg-icons'
// import { faInstagram } from '@fortawesome/free-brands-svg-icons'
</script>

<style scoped>
@layer ui {
	/* Cross-axis centre for the flex-column stack (align-items on flex-col is horizontal).
	   Vertical padding is component-owned — footer has no chrome marker to pull it from. */
	.basic-footer {
		align-items: center;
		padding-block: var(--sf-spacing-md);
	}
}
</style>
