<template>
	<!-- An arrow back, not ✕: it goes to the page before and asks first, where ✕ reads as
	     closing and throwing away. Its tooltip is its name. -->
	<SfIconButton
		icon="arrow-left"
		tooltip="Exit"
		:loudness="1"
		class="sf-is-contained"
		@click="exit"
	/>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
// Opens the page this one was opened from in this tab, which vue-router keeps with each history
// entry; with none (the tab's first page, or one reached through sign-in) it goes home. A move like
// a link's, so the editor's Leave question applies, after a reload too.
const exit = () => {
	const { back } = router.options.history.state
	void router.push(typeof back === 'string' ? back : '/')
}
</script>
