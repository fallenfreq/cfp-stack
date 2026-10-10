import { GAP_LAYOUT_SELECTOR } from './slLayout.js'

// The content box TipTap puts inside a block a component renders (a node view) holds the node's
// child blocks, in the editor and on published pages. A layout's content box steps aside, so the
// blocks inside are the layout's own items. Arrangement, so it sits in the layout layer.
// The block's box (TipTap's marker) sets its text back to normal wrapping, which the editor's
// document doesn't use; the weakest rule, so any class or style on the block wins.

export const NODE_VIEWS = `@layer sl-layout {
	:is(${GAP_LAYOUT_SELECTOR}) > [data-node-view-content] { display: contents; }
}
@layer reset {
	:where([data-node-view-wrapper]) { white-space: normal; }
}
`
