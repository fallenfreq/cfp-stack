import { STEP_ASIDE_LAYOUT_SELECTOR } from './slLayout.js'

// The elements TipTap adds around a node view (a block rendered by a Vue component), in the
// editor and on published pages: a wrapper outside the component, and a content box inside
// it that holds the node's child blocks.
//   Each node view is a width container, so sl-collapse-* and sl-hide/show-below-* inside it
//     follow the block's width.
//   A layout's content box steps aside, so the blocks inside are the layout's own items.

export const NODE_VIEWS = `[data-node-view-wrapper] { container-type: inline-size; }
:is(${STEP_ASIDE_LAYOUT_SELECTOR}) > [data-node-view-content] { display: contents; }
`
