import type { RouteLocationRaw } from 'vue-router'

// `to` makes the card a link.
export type GridItem = { imageUrl: string; title: string; to?: RouteLocationRaw } & Record<
	string,
	unknown
>
