<template>
	<footer class="border-t mt-8 py-4 flex flex-col items-center">
		<div class="text-sm">&copy; {{ year }} somefreq. All rights reserved.</div>
		<div class="flex space-x-4 mt-4">
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
		<div class="mt-4">
			<DarkModeSwitch />
		</div>
	</footer>
</template>

<script setup lang="ts">
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const year = new Date().getFullYear()
// import { faFacebook } from '@fortawesome/free-brands-svg-icons'
// import { faInstagram } from '@fortawesome/free-brands-svg-icons'
</script>
