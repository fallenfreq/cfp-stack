<template>
	<RouterLink v-if="item.to" :to="item.to" :class="rowClass" exact-active-class="sf-on-current">
		<NavIcon :icon="item.icon" />
		{{ item.title }}
	</RouterLink>
	<button v-else type="button" :class="rowClass" @click="item.action?.()">
		<NavIcon :icon="item.icon" />
		{{ item.title }}
	</button>
</template>

<script setup lang="ts">
import { NavIcon, type NavLink } from './navItems'

// One row in a SiteNav dropdown or narrow menu: icon and title, a link or a command.
defineProps<{ item: NavLink }>()
const rowClass = 'sl-cluster sf-gap-xs sf sf-is-contained sf-on-hover sf-on-active'
</script>
