import { forBlocks } from './slLayout.js'

// sl-object-* is vocabulary-only in the DB — the rules need child element
// selectors (.sl-object-cover > img:only-child) which the class_rules schema
// cannot express (selector is always the class element, not a descendant).
// Two selectors per value:
//   img.sl-object-*             — class on the <img> itself (TipTap image node).
//                                 No height: the img's own aspect-ratio determines it.
//   .sl-object-* > img:only-child — class on a container; the container provides the
//                                   height via its own aspect-ratio, so height: 100%
//                                   fills that box. :only-child guard prevents affecting
//                                   images alongside other content. Reaches through a
//                                   component's content box too (forBlocks, slLayout.ts).
// No display here: the reset already shows images as blocks, and a display set here would
// outweigh the hide and show classes (sl-hide-below-*, sl-show-below-*), so a picture would show
// at widths it's hidden at.

export const SL_OBJECT = `@layer sl-layout {
	img.sl-object-cover { object-fit: cover; width: 100%; }
	${forBlocks('.sl-object-cover > img:only-child')} { object-fit: cover; width: 100%; height: 100%; }
	img.sl-object-contain { object-fit: contain; width: 100%; }
	${forBlocks('.sl-object-contain > img:only-child')} { object-fit: contain; width: 100%; height: 100%; }
	img.sl-object-fill { object-fit: fill; width: 100%; }
	${forBlocks('.sl-object-fill > img:only-child')} { object-fit: fill; width: 100%; height: 100%; }
	img.sl-object-none { object-fit: none; }
	${forBlocks('.sl-object-none > img:only-child')} { object-fit: none; }
}
`
