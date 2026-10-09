import {
	COLLAPSE_CLASS_SELECTOR,
	GAP_LAYOUT_SELECTOR,
	ROW_LAYOUT_SELECTOR,
	SIZED_BY_CONTENT_SELECTOR,
} from './slLayout.js'

// The elements TipTap adds around a node view (a block rendered by a Vue component), in the
// editor and on published pages: a wrapper outside the component, and a content box inside
// it that holds the node's child blocks. Arrangement, so it sits in the layout layer.
//   A block that collapses measures the space it has: its wrapper is its width container.
//     Not where its width comes from its content (SIZED_BY_CONTENT_SELECTOR) — it would be
//     0 wide there; it measures the next box out instead.
//   A layout's content box steps aside, so the blocks inside are the layout's own items.
//   In a row, a block's wrapper is a one-cell grid as wide as itself, so the component
//     stretches with it as a plain block would (its own margins inside the row) and is as wide
//     as a plain block would be. Zero weight, so a placement class's display wins.

export const NODE_VIEWS = `@layer sl-layout {
	[data-node-view-wrapper]:where(:not(${SIZED_BY_CONTENT_SELECTOR})):has(> ${COLLAPSE_CLASS_SELECTOR}) { container-type: inline-size; }
	:is(${GAP_LAYOUT_SELECTOR}) > [data-node-view-content] { display: contents; }
	:where(${ROW_LAYOUT_SELECTOR}) > :where([data-node-view-wrapper]), :where(${ROW_LAYOUT_SELECTOR}) > :where([data-node-view-content]) > :where([data-node-view-wrapper]) { display: grid; grid-template-columns: 100%; }
}
`
