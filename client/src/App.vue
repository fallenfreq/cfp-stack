<script setup lang="ts">
import AccountIcon from '@/components/account/AccountIcon.vue'
import type { NavItem } from '@/components/navItems'
import { useSyntaxHighlighting } from '@/composables/editor/syntaxHighlighting'
import zitadelAuth from '@/services/zitadelAuth'
import { computed, markRaw } from 'vue'
import { RouterView } from 'vue-router'

// Code block colours on every page, not only in the editor.
useSyntaxHighlighting()

const navItems = computed<NavItem[]>(() => {
	const signedIn = zitadelAuth.oidcAuth.isAuthenticated
	return [
		{ title: 'Contact', icon: 'info', to: '/contact' },
		{
			title: 'Portfolio',
			icon: 'dashboard',
			children: [
				{ title: 'Branding', icon: 'view_comfy', to: '/c/branding' },
				{ title: 'Web & App Design', icon: 'view_comfy', to: '/c/web-design' },
			],
		},
		...(signedIn
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
			children: signedIn
				? [
						{ title: 'Account', icon: 'account_circle', to: '/account' },
						...(zitadelAuth.hasRole('admin')
							? [{ title: 'Admin', icon: 'settings', to: '/admin' }]
							: []),
						{
							title: 'Sign out',
							icon: 'exit_to_app',
							action: () => zitadelAuth.oidcAuth.signOut(),
						},
					]
				: [{ title: 'Log in', icon: 'person', to: '/account' }],
		},
	]
})
</script>

<template>
	<div class="app-frame">
		<header class="app-header sl-inset">
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
			<BasicFooter class="app-footer" />
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
	   open below its button. The footer follows the content, then stays at the bottom of the
	   screen while the room scrolls up. */
	.app-frame:has(.tiptap[contenteditable='true']) .app-end {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		min-block-size: calc(
			100dvh - var(--sf-spacing_page) - var(--editor-top-bar-height, 0px) - 1lh
		);
	}
	.app-frame:has(.tiptap[contenteditable='true']) .app-footer {
		position: sticky;
		inset-block-end: 0;
	}
}
</style>
