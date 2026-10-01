import {
	COLLAPSE_CLASS_SELECTOR,
	GAP_LAYOUT_SELECTOR,
	SIZED_BY_CONTENT_SELECTOR,
} from './slLayout.js'

// The elements TipTap adds around a node view (a block rendered by a Vue component), in the
// editor and on published pages: a wrapper outside the component, and a content box inside
// it that holds the node's child blocks. Arrangement, so it sits in the layout layer.
//   A block that collapses measures the space it has: its wrapper is its width container.
//     Not where its width comes from its content (SIZED_BY_CONTENT_SELECTOR) — it would be
//     0 wide there; it measures the next box out instead.
//   A layout's content box steps aside, so the blocks inside are the layout's own items.

export const NODE_VIEWS = `@layer sl-layout {
	[data-node-view-wrapper]:where(:not(${SIZED_BY_CONTENT_SELECTOR})):has(> ${COLLAPSE_CLASS_SELECTOR}) { container-type: inline-size; }
	:is(${GAP_LAYOUT_SELECTOR}) > [data-node-view-content] { display: contents; }
}
`
