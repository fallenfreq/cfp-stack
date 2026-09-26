<script setup lang="ts">
import { useSyntaxHighlighting } from '@/composables/editor/syntaxHighlighting'
import { RouterView } from 'vue-router'

// Code block colours on every page, not only in the editor.
useSyntaxHighlighting()
</script>

<template>
	<div class="app-frame">
		<header class="m-3">
			<vuesticNavBar />
		</header>

		<main>
			<RouterView />
		</main>

		<BasicFooter />
	</div>
</template>

<style scoped>
@layer ui {
	/* Header, page and footer fill at least the screen; the page takes the spare height so
	   the footer sits at the bottom on short pages. Plain layout, no gap: they sit flush. */
	.app-frame {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}
	main {
		flex: 1;
	}
}
</style>
