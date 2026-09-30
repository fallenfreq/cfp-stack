// Embedded videos in a TipTap document: the editor and published pages.
//   A responsive video fills its width limit and keeps a 16:9 box. This is the default when
//   the author picks nothing, so it sits in the lowest layer: an sl-aspect-* choice or the
//   node's own style wins. data-responsive is rendered by the node (youtubeExtension.ts),
//   never stored.

export const EMBEDS = `@layer reset {
	[data-youtube-video] > iframe[data-responsive] { width: 100%; height: auto; aspect-ratio: 16 / 9; }
}
`
