// The page's starting point before any theme applies: browser differences evened out and
// element defaults cleared, so the theme's rules decide how things look. Fixed CSS, the
// same under every theme, never stored in the DB. Lowest cascade priority (reset is the
// first layer declared).

export const RESET = `@layer reset {
	/* Width includes padding and border. A border shows by giving it a width. */
	*,
	::before,
	::after {
		box-sizing: border-box;
		border-width: 0;
		border-style: solid;
		border-color: rgb(var(--sf-border_color));
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
	/* Remove trailing margin from the last child of any table cell */
	td > *:last-child,
	th > *:last-child {
		margin-bottom: 0;
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

	/* Compact units are inline boxes, so their padding applies on a <span>. */
	.sf-chip,
	.sf-tag,
	.sf-status,
	.sf-counter {
		display: inline-block;
	}

	/* sf-swatch structural — display enables width/height on the marker;
	   background-clip guards padded-frame themes so bg doesn't bleed into the border. */
	.sf-swatch {
		display: inline-block;
		background-clip: padding-box;
	}

	/* Native colour input: strip UA inset chrome so swatch treatment can render. */
	input[type="color"].sf-swatch {
		padding: 0;
		background: none;
	}

	/* Native <select>.sf-field: strip UA appearance so the custom chevron renders,
	   align cursor across browsers (Firefox: pointer, Chrome: default). */
	select.sf-field {
		appearance: none;
		cursor: pointer;
	}
}`
