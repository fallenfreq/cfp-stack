<template>
	<SfPopover v-if="item.children" class="sf-size-xs" align="end" close-on-click>
		<template #trigger="trigger">
			<SfTooltip :text="item.iconOnly ? item.title : ''" placement="bottom">
				<button
					v-bind="trigger"
					type="button"
					:class="[barClass, { 'sf-on-ancestor': isAncestor(item, route.path) }]"
					:aria-label="item.iconOnly ? item.title : undefined"
				>
					<NavIcon v-if="item.iconOnly" :icon="item.icon" class="sf-text-2xl" />
					<template v-else>
						{{ item.title }}
						<MaterialIcon>expand_more</MaterialIcon>
					</template>
				</button>
			</SfTooltip>
		</template>
		<menu class="nav-menu sl-stack sf-gap-2xs">
			<li v-for="child in item.children" :key="child.title">
				<SiteNavMenuLink :item="child" />
			</li>
		</menu>
	</SfPopover>
	<SfTooltip v-else :text="item.iconOnly ? item.title : ''" placement="bottom">
		<RouterLink
			v-if="item.to"
			:to="item.to"
			:class="barClass"
			exact-active-class="sf-on-current"
			:aria-label="item.iconOnly ? item.title : undefined"
		>
			<NavIcon v-if="item.iconOnly" :icon="item.icon" class="sf-text-2xl" />
			<template v-else>{{ item.title }}</template>
		</RouterLink>
		<button
			v-else
			type="button"
			:class="barClass"
			:aria-label="item.iconOnly ? item.title : undefined"
			@click="item.action?.()"
		>
			<NavIcon v-if="item.iconOnly" :icon="item.icon" class="sf-text-2xl" />
			<template v-else>{{ item.title }}</template>
		</button>
	</SfTooltip>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { isAncestor, NavIcon, type NavItem } from './siteNav'

// One item in SiteNav's bar: a link, a command, or a group that opens as a dropdown.
defineProps<{ item: NavItem }>()
const route = useRoute()

const barClass = 'sl-cluster sf-gap-2xs sf sf-is-contained sf-size-sm sf-on-hover sf-on-active'
</script>
