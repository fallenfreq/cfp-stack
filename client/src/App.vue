<script setup lang="ts">
import AccountIcon from '@/components/account/AccountIcon.vue'
import type { NavItem } from '@/components/siteNav'
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
	.app-header {
		padding-block-start: var(--sf-spacing_page);
	}
}
</style>
