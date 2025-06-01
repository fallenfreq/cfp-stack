<template>
	<!--
    overflow-hidden stops the dark mode switch from creating a horizontal scroll bar on the viewport
    I put it here instead of the dark mode switch because otherwise the focus highlight on the dark mode switch gets cut off
  -->
	<VaNavbar color="BackgroundPrimary" class="overflow-hidden rounded-lg border h-auto p-3 mb-3">
		<template #left>
			<VaNavbarItem>
				<RouterLink class="flex items-center" to="/" tabindex="0" style="cursor: pointer">
					<MothLogo class="text-primary hidden xs:block mr-4 w-8" />
					<MothWordmark class="h-5" />
				</RouterLink>
			</VaNavbarItem>
		</template>

		<template #right>
			<template v-for="item in items" :key="item.title">
				<VaNavbarItem
					v-if="!item.visible || item.visible()"
					:class="{ 'hidden sm:block': !item.outsideHamburger }"
				>
					<VaButton v-if="!('children' in item)" v-bind="getNavButtonProps(item)">
						{{ item.title }}
					</VaButton>
					<VaDropdown v-else :stick-to-edges="true">
						<template #anchor>
							<VaButton v-bind="getDropdownAnchorButtonProps(item)">
								{{ item.title }}
							</VaButton>
						</template>

						<VaDropdownContent class="w-64">
							<template v-for="child in item.children" :key="child.title">
								<VaSidebarItem v-bind="getSidebarItemProps(child)">
									<VaSidebarItemContent>
										<VaIcon :name="child.icon" />
										<VaSidebarItemTitle>{{ child.title }}</VaSidebarItemTitle>
									</VaSidebarItemContent>
								</VaSidebarItem>
							</template>
						</VaDropdownContent>
					</VaDropdown>
				</VaNavbarItem>
			</template>
			<VaNavbarItem>
				<DarkModeSwitch />
			</VaNavbarItem>
			<VaNavbarItem class="sm:hidden">
				<div class="h-10 border-r ml-3" />
			</VaNavbarItem>
			<VaNavbarItem class="sm:hidden">
				<VaDropdown :stick-to-edges="true" :close-on-content-click="false">
					<template #anchor>
						<VaButton size="large" text-color="TextPrimary" preset="secondary" icon="menu" />
					</template>

					<VaDropdownContent class="w-64">
						<template v-for="item in items" :key="item.title">
							<VaSidebarItem
								v-if="!('children' in item) && !item.outsideHamburger && item.visible()"
								v-bind="getSidebarItemProps(item)"
							>
								<VaSidebarItemContent>
									<VaIcon :name="item.icon" />
									<VaSidebarItemTitle>{{ item.title }}</VaSidebarItemTitle>
								</VaSidebarItemContent>
							</VaSidebarItem>

							<VaAccordion v-else-if="!item.outsideHamburger && (!item.visible || item.visible())">
								<VaCollapse body-color="BackgroundElement">
									<template #header="{ value: isCollapsed }">
										<VaSidebarItem
											:active="
												'children' in item &&
												item.children.some((child) => 'to' in child && child.to === route.path)
											"
										>
											<VaSidebarItemContent>
												<VaIcon :name="item.icon" />
												<VaSidebarItemTitle>{{ item.title }}</VaSidebarItemTitle>
												<VaSpacer />
												<VaIcon :name="isCollapsed ? 'va-arrow-up' : 'va-arrow-down'" />
											</VaSidebarItemContent>
										</VaSidebarItem>
									</template>
									<template v-if="'children' in item" #body>
										<template v-for="child in item.children">
											<VaSidebarItem
												v-if="child.visible()"
												:key="child.title"
												:active="'to' in child && route.path === child.to"
											>
												<VaSidebarItemContent>
													<VaIcon :name="child.icon" />
													<VaSidebarItemTitle>{{ child.title }}</VaSidebarItemTitle>
												</VaSidebarItemContent>
											</VaSidebarItem>
										</template>
									</template>
								</VaCollapse>
							</VaAccordion>
						</template>
					</VaDropdownContent>
				</VaDropdown>
			</VaNavbarItem>
		</template>
	</VaNavbar>
</template>
<script setup lang="ts">
import zitadelAuth from '@/services/zitadelAuth'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import MothLogo from './brand/MothLogo.vue'
import MothWordmark from './brand/MothWordmark.vue'

interface BaseMenuItem {
	title: string
	icon: string
	visible: () => boolean
	outsideHamburger: boolean
}

type ToMenuItem = BaseMenuItem & {
	to: string
}

type CommandMenuItem = BaseMenuItem & {
	command: () => void
}

type ParentMenuItem = BaseMenuItem & {
	children: MenuItem[]
}

export type MenuItem = ToMenuItem | CommandMenuItem | ParentMenuItem

function createMenuItem(
	item: Partial<BaseMenuItem> &
		({ to: string } | { command: () => void } | { children: MenuItem[] })
): MenuItem {
	return {
		title: item.title ?? '',
		icon: item.icon ?? '',
		outsideHamburger: item.outsideHamburger ?? false,
		visible: item.visible ?? (() => true),
		...('to' in item ? { to: item.to } : {}),
		...('command' in item ? { command: item.command } : {}),
		...('children' in item ? { children: item.children } : {})
	} as MenuItem
}

function getNavButtonProps(item: MenuItem) {
	const props: Record<string, any> = {
		size: 'large',
		preset: 'secondary'
	}

	if ('to' in item) {
		props.to = item.to
		props['text-color'] = route.path === item.to ? 'Primary' : 'TextPrimary'
	} else if ('command' in item) {
		props.onClick = item.command
		props.onKeydownEnter = item.command
		props['text-color'] = 'TextPrimary'
	}

	if (!item.title) {
		props.icon = item.icon
	}

	return props
}

function getDropdownAnchorButtonProps(item: MenuItem) {
	const props: Record<string, any> = {
		size: 'large',
		preset: 'secondary',
		'text-color':
			'children' in item && item.children.some((child) => 'to' in child && route.path === child.to)
				? 'Primary'
				: 'TextPrimary'
	}

	if (!item.title) {
		props.icon = item.icon
		props['opened-icon'] = item.icon
	} else {
		props['icon-right'] = 'va-arrow-down'
	}

	return props
}

function getSidebarItemProps(item: MenuItem) {
	const props: Record<string, any> = {
		active: 'to' in item && route.path === item.to
	}

	if ('to' in item) {
		props.to = item.to
	} else if ('command' in item) {
		props.onClick = item.command
		props.onKeydownEnter = item.command
	}

	return props
}

const route = useRoute()

const items = ref<MenuItem[]>([
	createMenuItem({ title: 'Contact', icon: 'info', to: '/contact' }),
	createMenuItem({
		title: 'Portfolio',
		icon: 'dashboard',
		children: [
			createMenuItem({ title: 'Branding', icon: 'view_comfy', to: '/portfolio/branding' }),
			createMenuItem({ title: 'Web & App Design', icon: 'view_comfy', to: '/portfolio/web-design' })
		]
	}),
	createMenuItem({
		icon: 'account_circle',
		outsideHamburger: true,
		children: [
			createMenuItem({
				title: 'Profile',
				icon: 'account_circle',
				to: '/profile',
				visible: () => zitadelAuth.oidcAuth.isAuthenticated
			}),
			createMenuItem({
				title: 'Admin',
				icon: 'settings',
				to: '/admin',
				visible: () => zitadelAuth.hasRole('admin')
			}),
			createMenuItem({
				title: 'Signout',
				icon: 'exit_to_app',
				command: () => zitadelAuth.oidcAuth.signOut(),
				visible: () => zitadelAuth.oidcAuth.isAuthenticated
			}),
			createMenuItem({
				title: 'Login',
				icon: 'person',
				to: '/login',
				visible: () => !zitadelAuth.oidcAuth.isAuthenticated
			})
		]
	})
])

// const items = ref<MenuItem[]>([
//   { title: 'Contact', icon: 'info', to: '/contact' },
//   {
//     title: 'Portfolio',
//     icon: 'dashboard',
//     children: [
//       {
//         title: 'Branding',
//         icon: 'view_comfy',
//         to: '/portfolio/branding'
//       },
//       {
//         title: 'Web & App Design',
//         icon: 'view_comfy',
//         to: '/portfolio/web-design'
//       }
//     ]
//   },
//   {
//     title: '',
//     icon: 'account_circle',
//     outsideHamburger: true,
//     children: [
//       {
//         icon: 'account_circle',
//         title: 'Profile',
//         to: '/profile',
//         visible: () => zitadelAuth.oidcAuth.isAuthenticated
//       },
//       {
//         title: 'Admin',
//         icon: 'settings',
//         to: '/admin',
//         visible: () => {
//           return zitadelAuth.hasRole('admin')
//         }
//       },
//       {
//         title: 'Signout',
//         icon: 'exit_to_app',
//         command: () => zitadelAuth.oidcAuth.signOut(),
//         visible: () => zitadelAuth.oidcAuth.isAuthenticated
//       },
//       {
//         title: 'Login',
//         icon: 'person',
//         to: '/login',
//         visible: () => !zitadelAuth.oidcAuth.isAuthenticated
//       }
//     ]
//   }
// ])
</script>

<style scoped>
.va-navbar__item {
	margin-right: 5px;
}
</style>
