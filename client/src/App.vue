<script setup lang="ts">
import AccountIcon from '@/components/account/AccountIcon.vue'
import type { NavItem } from '@/components/navItems'
import { useSyntaxHighlighting } from '@/composables/editor/syntaxHighlighting'
import { hasRole, signedIn, signOut } from '@/services/session'
import { computed, markRaw } from 'vue'
import { RouterView, START_LOCATION, useRouter } from 'vue-router'
import { useScrollRestoration } from 'vue-router/experimental'

// Code block colours on every page, not only in the editor.
useSyntaxHighlighting()
// Every page's place is kept and put back (router/pagePlace.ts).
useScrollRestoration()

const router = useRouter()
// The editor brings its own bars (router/index.ts). Until the first page is known, the address
// being opened is asked about, so the header doesn't show on the editor and then go.
const opening = router.resolve(router.options.history.location)
const isEditor = computed(() => {
	const at = router.currentRoute.value
	return (at === START_LOCATION ? opening : at).meta.editor === true
})

const navItems = computed<NavItem[]>(() => {
	return [
		{ title: 'Contact', icon: 'info', to: '/contact' },
		{
			title: 'Portfolio',
			icon: 'dashboard',
			// The seed adds these collections if missing (MENU_COLLECTIONS in api/scripts/seed.mjs).
			children: [
				{ title: 'Branding', icon: 'view_comfy', to: '/c/branding' },
				{
					title: 'Software Development',
					icon: 'view_comfy',
					to: '/c/software-development',
				},
			],
		},
		...(signedIn.value
			? [
					{
						title: 'Demo',
						icon: 'science',
						children: [
							{ title: 'Editor', icon: 'edit_note', to: '/demo/editor' },
							{ title: 'Map', icon: 'map', to: '/demo/map' },
						],
					},
				]
			: []),
		{
			title: 'Account',
			icon: markRaw(AccountIcon),
			iconOnly: true,
			alwaysShown: true,
			children: signedIn.value
				? [
						{ title: 'Account', icon: 'account_circle', to: '/account' },
						...(hasRole('admin')
							? [{ title: 'Admin', icon: 'settings', to: '/admin' }]
							: []),
						{
							title: 'Sign out',
							icon: 'exit_to_app',
							action: signOut,
						},
					]
				: [{ title: 'Log in', icon: 'person', to: '/account' }],
		},
	]
})
</script>

<template>
	<div class="app-frame">
		<header v-if="!isEditor" class="app-header sl-inset">
			<SiteNav :items="navItems">
				<template #brand>
					<MothBrand />
				</template>
				<template #end>
					<DarkModeSwitch />
				</template>
			</SiteNav>
		</header>

		<main>
			<RouterView />
		</main>

		<div class="app-end">
			<BasicFooter v-if="!isEditor" class="app-footer" />
		</div>
	</div>
	<PromptModal />
	<SfToasts />
	<SfAnnouncer />
</template>

<style scoped>
@layer ui {
	/* Header, page and footer fill at least the screen; the page takes the spare height so
	   the footer sits at the bottom on short pages. The page margin is the room between them,
	   as above the header and at the sides, so a page adds no top or bottom room of its own. */
	.app-frame {
		display: flex;
		flex-direction: column;
		gap: var(--sf-spacing_page);
		min-height: 100dvh;
	}
	main {
		flex: 1;
	}
	.app-header {
		padding-block-start: var(--sf-spacing_page);
	}

	/* While writing, the page scrolls on past its end until its last line sits under the
	   editor's top bar: room to bring the line being written up the screen, and for a panel to
	   open below its button. */
	.app-frame:has(.tiptap[contenteditable='true']) .app-end {
		min-block-size: calc(
			100dvh - var(--sf-spacing_page) - var(--editor-top-bar-height, 0px) - 1lh
		);
		/* A WebKit workaround (Safari 27): its scroll anchoring, which keeps the line being written
		   still as pictures above it load, works only with a size container outside the editor.
		   The site's nav is one, and the editor hides it. Remove once WebKit is fixed
		   (sf-system-todo.md, "Safari's scroll anchoring in the editor"). */
		container-type: inline-size;
	}
}
</style>
