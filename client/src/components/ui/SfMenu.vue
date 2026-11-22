<template>
	<!-- The items of a menu in a popover ("⋯", the site's nav menus), so every menu spaces them
	     alike; each item goes in its own <li>. It's as wide as its items: straight in a popover it
	     never measures width, so items that show or hide by width measure the next box out (in
	     the editor's "⋯", its bar). To measure a width of its own, put it in a box with that
	     width (sf-system.md, "A popover is laid out on its own"). -->
	<menu class="menu-list sl-stack sf-gap-2xs">
		<slot />
	</menu>
</template>

<style>
@layer ui {
	/* Each item fills its row, so links and buttons light up alike, with their contents at the
	   start (a button centres its own). */
	.menu-list > li > * {
		inline-size: 100%;
		justify-content: start;
		text-align: start;
	}
}
</style>
