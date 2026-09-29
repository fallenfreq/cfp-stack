<template>
	<!-- Where announce() messages go. Screen readers read out each line as it's added.
	     One sits in App, and one inside every modal dialog: an open modal shuts the rest
	     of the page off from screen readers, and a closed one hides its own copy, so the
	     one copy that can be reached is read. Each message goes only to the copy that
	     could be heard when it was sent. Kept out of sight, which is behaviour, not
	     a look, so it lives here and not in the theme. -->
	<div ref="root" class="announcer" aria-live="polite">
		<div v-for="item in shown" :key="item.id">{{ item.message }}</div>
	</div>
</template>

<script setup lang="ts">
import { announcements } from '@/services/announce'
import { computed, onMounted, ref } from 'vue'

// A copy inside a dialog reads what was sent while a modal was open; the page's copy reads
// the rest (see Announcement.inModal).
const root = ref<HTMLElement | null>(null)
const inDialog = ref(false)
onMounted(() => {
	inDialog.value = root.value?.closest('dialog') != null
})
const shown = computed(() => announcements.filter((a) => a.inModal === inDialog.value))
</script>

<style scoped>
@layer ui {
	/* In the page for screen readers, out of sight and taking no space. */
	.announcer {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		border: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
}
</style>
