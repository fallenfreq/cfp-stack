<template>
	<!-- The nav is the width container: its links give way to a menu button when it is narrow.
	     Its columns are the brand plus one per group that shows, so no empty column adds a gap. -->
	<nav
		class="site-nav sl-columns sl-align-y-center sf-gap-sm sf-depth-1"
		:style="`--sl-cols: 1fr repeat(${groupCount}, auto)`"
		:aria-label="label"
	>
		<div><slot name="brand" /></div>

		<ul v-if="inlineItems.length" class="nav-links sl-cluster sf-gap-2xs sl-hide-below-sm">
			<li v-for="item in inlineItems" :key="item.title">
				<SiteNavItem :item="item" />
			</li>
		</ul>

		<ul v-if="alwaysShownItems.length" class="nav-links sl-cluster sf-gap-2xs">
			<li v-for="item in alwaysShownItems" :key="item.title">
				<SiteNavItem :item="item" />
			</li>
		</ul>

		<div v-if="$slots.end"><slot name="end" /></div>

		<div v-if="inlineItems.length" class="sl-show-below-sm">
			<SfPopover class="sf-size-xs" align="end" close-on-click>
				<template #trigger="trigger">
					<SfTooltip text="Menu" placement="bottom">
						<button
							v-bind="trigger"
							type="button"
							class="nav-icon-btn sf sf-is-contained sf-size-sm sf-on-hover sf-on-active"
							aria-label="Menu"
						>
							<MaterialIcon class="sf-text-2xl">menu</MaterialIcon>
						</button>
					</SfTooltip>
				</template>
				<menu class="nav-menu sl-stack sf-gap-2xs">
					<li v-for="item in inlineItems" :key="item.title">
						<details v-if="item.children" :open="isAncestor(item, route.path)">
							<summary
								class="sl-cluster sf-gap-xs sf sf-is-contained sf-on-hover sf-on-active"
								:class="{ 'sf-on-ancestor': isAncestor(item, route.path) }"
							>
								<NavIcon :icon="item.icon" />
								{{ item.title }}
								<MaterialIcon class="nav-chevron">expand_more</MaterialIcon>
							</summary>
							<menu class="sl-stack sf-gap-2xs sf-is-nested">
								<li v-for="child in item.children" :key="child.title">
									<SiteNavMenuLink :item="child" />
								</li>
							</menu>
						</details>
						<SiteNavMenuLink v-else :item="item" />
					</li>
				</menu>
			</SfPopover>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { isAncestor, NavIcon, type NavItem } from './navItems'

// A site's main navigation. Items go in as data: a link (to), a command (action) or a
// group (children), which opens as a dropdown. On a narrow nav every item but the
// always-shown ones moves into a menu, where groups expand in place. Filter the list
// (signed in or not) before passing it.
const props = withDefaults(
	defineProps<{
		items: NavItem[]
		// The name screen readers announce for the nav.
		label?: string
	}>(),
	{ label: 'Main' },
)

const route = useRoute()
const slots = useSlots()
const inlineItems = computed(() => props.items.filter((item) => !item.alwaysShown))
const alwaysShownItems = computed(() => props.items.filter((item) => item.alwaysShown))
// The inline links and the menu button never show together, so they share a column.
const groupCount = computed(
	() =>
		(inlineItems.value.length ? 1 : 0)
		+ (alwaysShownItems.value.length ? 1 : 0)
		+ (slots.end ? 1 : 0),
)
</script>

<style>
@layer ui {
	.site-nav :is(ul, menu) {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nav-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.nav-menu {
		min-inline-size: 12rem;
	}

	/* The chevron stands in for the browser's marker, at the far end of the row. */
	.nav-menu summary {
		list-style: none;
		cursor: pointer;
	}
	.nav-menu summary::-webkit-details-marker {
		display: none;
	}
	.nav-chevron {
		margin-inline-start: auto;
	}
	.nav-menu details[open] > summary .nav-chevron {
		rotate: 180deg;
	}
	/* A group's links sit just under its heading; the theme marks them as nested. */
	.nav-menu details > menu {
		margin-block-start: var(--sf-spacing-2xs);
	}
}
</style>
