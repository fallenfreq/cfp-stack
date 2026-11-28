// The page's starting point before any theme applies: browser differences evened out and
// element defaults cleared, so the theme's rules decide how things look. Fixed CSS, the
// same under every theme, never stored in the DB. Lowest cascade priority (reset is the
// first layer declared).
import { CHANNELS } from '@somefreq-app/shared/layouts'

// The parts of the line round an element, each passed by the class it means (sf-system.md, "Line
// parts"). Rules only, so they live here rather than with the layout channels.
const LINE_PARTS = [
	'--sfx-line-width',
	'--sfx-line-color',
	'--sfx-line-alpha',
	'--sfx-line-style',
	'--sfx-line-gap',
]

// A box's own fill, passed by the class that gives it one (sf-system.md, "Fill parts").
const FILL_PARTS = ['--sfx-fill-color', '--sfx-fill-border-color']

// A box's words: their colour, passed by a colour or a fill, and their strength, passed by quiet
// and hover (sf-system.md, "Text parts").
const TEXT_PARTS = ['--sfx-text-color', '--sfx-text-alpha']

// The focus ring's strength, passed by a look that shows focus another way (sf-system.md,
// "Keyboard focus").
const RING_PARTS = ['--sfx-ring-alpha']

// Typeless and with no starting value, so a reader's own default still applies when it's unset.
const notInherited = (names: readonly string[]) =>
	names
		.map(
			(name) => `@property ${name} {
	syntax: '*';
	inherits: false;
}`,
		)
		.join('\n')

export const RESET = `/* Spacing classes (sf-gap-*, sf-padding-*, sf-size-*, chrome's own padding) apply to the
   element that wears them: nothing inside takes them on. Every reader gives its own default,
   or none where an unset value already means "no spacing". */
${notInherited(CHANNELS)}

/* The line's parts likewise: a targeted or picked box doesn't change the lines inside it. */
${notInherited(LINE_PARTS)}

/* A fill likewise: a box inside a loud one doesn't take its fill. */
${notInherited(FILL_PARTS)}

/* Words likewise: a box inside a red or a quiet one doesn't take its words. */
${notInherited(TEXT_PARTS)}

/* The ring likewise: a box shown without it doesn't take it off what's inside. */
${notInherited(RING_PARTS)}

@layer reset {
	/* Width includes padding and border. A border shows by giving it a width. */
	*,
	::before,
	::after {
		box-sizing: border-box;
		border-width: 0;
		border-style: solid;
		border-color: rgb(var(--sf-border_color) / var(--sf-border_alpha));
	}

	html {
		line-height: 1.5;
		-webkit-text-size-adjust: 100%;
		tab-size: 4;
		-webkit-tap-highlight-color: transparent;
	}

	body {
		margin: 0;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	/* Elements start without the browser's spacing, sizes and markers: a heading is sized
	   by the classes it wears, a list shows markers where the theme or content gives them. */
	blockquote,
	dl,
	dd,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	hr,
	figure,
	p,
	pre {
		margin: 0;
	}
	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-size: inherit;
		font-weight: inherit;
	}
	ol,
	ul,
	menu {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	fieldset {
		margin: 0;
		padding: 0;
	}
	legend,
	dialog {
		padding: 0;
	}
	hr {
		height: 0;
		color: inherit;
		border-top-width: 1px;
	}
	a {
		color: inherit;
		text-decoration: inherit;
	}
	b,
	strong {
		font-weight: bolder;
	}
	abbr:where([title]) {
		text-decoration: underline dotted;
	}
	code,
	kbd,
	samp,
	pre {
		font-family: var(--sf-font-mono, ui-monospace, monospace);
		font-size: 1em;
	}
	small {
		font-size: 80%;
	}
	sub,
	sup {
		font-size: 75%;
		line-height: 0;
		position: relative;
		vertical-align: baseline;
	}
	sub {
		bottom: -0.25em;
	}
	sup {
		top: -0.5em;
	}
	table {
		text-indent: 0;
		border-color: inherit;
		border-collapse: collapse;
	}

	/* Form controls take the text around them; buttons start without the browser's chrome. */
	button,
	input,
	optgroup,
	select,
	textarea {
		font: inherit;
		letter-spacing: inherit;
		color: inherit;
		margin: 0;
		padding: 0;
	}
	button,
	select {
		text-transform: none;
	}
	button,
	input:where([type="button"], [type="reset"], [type="submit"]) {
		-webkit-appearance: button;
		background-color: transparent;
		background-image: none;
	}
	button,
	[role="button"] {
		cursor: pointer;
	}
	:disabled {
		cursor: default;
	}
	textarea {
		resize: vertical;
	}
	progress {
		vertical-align: baseline;
	}
	::-webkit-inner-spin-button,
	::-webkit-outer-spin-button {
		height: auto;
	}
	[type="search"] {
		-webkit-appearance: textfield;
		outline-offset: -2px;
	}
	::-webkit-search-decoration {
		-webkit-appearance: none;
	}
	::-webkit-file-upload-button {
		-webkit-appearance: button;
		font: inherit;
	}
	:-moz-focusring {
		outline: auto;
	}
	:-moz-ui-invalid {
		box-shadow: none;
	}
	summary {
		display: list-item;
	}

	/* Images and embeds sit on their own line and never overflow their container. */
	img,
	svg,
	video,
	canvas,
	audio,
	iframe,
	embed,
	object {
		display: block;
		vertical-align: middle;
	}
	img,
	video {
		max-width: 100%;
		height: auto;
	}

	[hidden]:where(:not([hidden="until-found"])) {
		display: none;
	}

	/* A popover opens in the top layer but still belongs to the page: its text colour comes
	   from where it sits, not the browser's CanvasText. */
	[popover] {
		color: inherit;
	}

	/* Compact units and marks are inline boxes, so their padding and size apply on a <span>. */
	.sf-chip,
	.sf-tag,
	.sf-status,
	.sf-counter,
	.sf-badge {
		display: inline-block;
	}

	/* A mark is the size the theme gives it: a row short of room cuts something else short
	   rather than squash a dot to an oval (it has no content to hold it open, as a count has). */
	.sf-badge {
		flex-shrink: 0;
	}

	/* A floating mark or count (placed with sl-over) never takes a press meant for the element
	   under it. */
	:is(.sf-badge, .sf-counter).sf-is-overlay {
		pointer-events: none;
	}

	/* sf-swatch structural — display enables width/height on the marker;
	   background-clip guards padded-frame themes so bg doesn't bleed into the border. */
	.sf-swatch {
		display: inline-block;
		background-clip: padding-box;
	}

	/* Native <select>.sf-field: strip UA appearance so the custom chevron renders,
	   align cursor across browsers (Firefox: pointer, Chrome: default). */
	select.sf-field {
		appearance: none;
		cursor: pointer;
	}
}`
