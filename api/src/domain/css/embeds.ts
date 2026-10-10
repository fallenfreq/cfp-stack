// Embedded videos, in the editor and on published pages: a video fills its width at 16:9, up to
// 36rem unless it bleeds. A default the author can override (the lowest layer): an sl-aspect-*
// choice or the video's own style wins. data-youtube-video is the node's marker, never stored.

export const EMBEDS = `@layer reset {
	iframe[data-youtube-video] { width: 100%; height: auto; aspect-ratio: 16 / 9; }
	iframe[data-youtube-video]:not(.sl-bleed) { max-width: 36rem; }
}
`
