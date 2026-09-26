// Preview stories: real components rendered with sample props. Markup in slots mirrors the
// real consumers (e.g. AdminPagesView) so the preview shows what the app renders.
import AccountHeader from '@/components/account/AccountHeader.vue'
import AdminList from '@/components/admin/AdminList.vue'
import AdminListItem from '@/components/admin/AdminListItem.vue'
import BasicCard from '@/components/BasicCard.vue'
import CollectionGrid from '@/components/CollectionGrid.vue'
import NodePath from '@/components/editor/NodePath.vue'
import ToolbarAttrRow from '@/components/editor/toolbar/ToolbarAttrRow.vue'
import ToolbarIcon from '@/components/editor/toolbar/ToolbarIcon.vue'
import StackableSheet from '@/components/layout/StackableSheet.vue'
import SfTooltip from '@/components/SfTooltip.vue'
import SfIcon from '@/components/ui/SfIcon.vue'
import SfPageShell from '@/components/ui/SfPageShell.vue'
import SfStatusDisplay from '@/components/ui/SfStatusDisplay.vue'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { h, type VNode } from 'vue'

// SfTooltip only opens on hover/touch, which the static preview can't do. This builds its popup
// with the real classes, data attributes and scoped CSS, placed flush against the trigger the way
// the component's script places it; the CSS gap does the rest. The wrapper's transform makes the
// fixed popup position against the trigger.
const flush: Record<string, string> = {
	top: 'bottom: 100%; left: 50%; transform: translateX(-50%)',
	bottom: 'top: 100%; left: 50%; transform: translateX(-50%)',
	left: 'right: 100%; top: 50%; transform: translateY(-50%)',
	right: 'left: 100%; top: 50%; transform: translateY(-50%)',
}
const openTooltip = (placement: string, input: 'mouse' | 'touch', label: string) =>
	h('div', { class: 'sl-stack sf-gap-2xs', style: 'align-items: center; padding: 72px 96px' }, [
		h('span', { style: 'position: relative; display: inline-flex; transform: translateZ(0)' }, [
			h(
				'button',
				{ class: 'sf-icon-btn sf sf-on-hover sf-size-xs', 'aria-label': label },
				h(SfIcon, { name: 'x' }),
			),
			h(
				'span',
				{
					role: 'tooltip',
					class: 'tooltip-popup sf sf-text-block sf-text-xs sf-depth-3 sf-size-2xs sf-is-overlay',
					'data-placement': placement,
					'data-input': input,
					[(SfTooltip as { __scopeId?: string }).__scopeId ?? 'data-v-preview']: '',
					style: flush[placement],
				},
				label,
			),
		]),
		h('small', { class: 'sf-loudness-1' }, `${placement}, ${input}`),
	])

export interface Story {
	id: string
	title: string
	/** What to look for — shown above the story. */
	notes?: string
	/** Constrain width to force overflow / narrow layouts. */
	maxWidth?: string
	render: () => VNode | VNode[]
}

const action = (label: string, extra = '') =>
	h(
		'button',
		{ class: `sf sf-is-contained sf-size-xs sf-text-sm sf-single-line sf-on-hover ${extra}` },
		label,
	)

const tagChips = (tags: string[]) =>
	h('button', { class: 'sl-cluster sf-gap-2xs sf sf-is-contained sf-size-2xs sf-on-hover' }, [
		...tags
			.slice(0, 2)
			.map((t) =>
				h('span', { class: 'sf-chip sf-size-2xs sf-variant-featured sf-loudness-2' }, t),
			),
		tags.length > 2
			? h('span', { class: 'sf-chip sf-size-2xs sf-loudness-1' }, `+${tags.length - 2}`)
			: null,
	])

const rows = [
	{ name: 'Home', slug: 'home', published: true, tags: ['featured'] },
	{ name: 'A much longer page name', slug: 'about/the-team', published: false, tags: [] },
	{ name: 'Blog', slug: 'blog', published: true, tags: ['news', 'updates', 'archive'] },
]

const adminList = () =>
	h(
		AdminList,
		{},
		{
			header: () => [
				h('th', 'Name'),
				h('th', 'Slug'),
				h('th', 'Tags'),
				h('th', 'Published'),
				h('th', { class: 'sl-pin-right sf-boundary-left' }),
			],
			default: () =>
				rows.map((r) =>
					h(
						AdminListItem,
						{ name: r.name, slug: r.slug, published: r.published },
						{
							meta: () =>
								r.tags.length
									? tagChips(r.tags)
									: h('span', { class: 'sf-text-xs sf-loudness-1' }, '—'),
							actions: () => [
								action('Edit'),
								action('Delete', 'sf-variant-danger'),
							],
						},
					),
				),
		},
	)

// NodePath reads a live tiptap editor; this fake exposes just the selection path it walks.
const fakeEditor = (names: string[]) => ({
	state: {
		selection: { anchor: 1 },
		doc: {
			resolve: () => ({
				depth: names.length - 1,
				node: (d: number) => ({ type: { name: names[d] } }),
				start: (d: number) => d,
			}),
		},
	},
	on: () => undefined,
	off: () => undefined,
})

// ─── Edge alignment: page line, bands, scrolling table ─────────────────────────
// Rendered at two page margins (--sf-spacing_page overridden inline, as a theme would)
// so anything that copied a number instead of reading the line would show.

const wideTable = () =>
	h('table', { class: 'sf', style: 'white-space: nowrap' }, [
		h('thead', [
			h('tr', [
				...['Name', 'Slug', 'Updated', 'Status'].map((t) => h('th', t)),
				h('th', { class: 'sl-pin-right sf-boundary-left' }),
			]),
		]),
		h(
			'tbody',
			['Home', 'About the team', 'Blog'].map((n) =>
				h('tr', [
					...[n, n.toLowerCase().replaceAll(' ', '-'), '2026-09-24', 'Published'].map(
						(c) => h('td', c),
					),
					h('td', { class: 'sl-pin-right sf-boundary-left' }, '⋯'),
				]),
			),
		),
	])

const bandRow = () =>
	h('div', { class: 'sl-cluster sf-gap-xs' }, [
		h('strong', { class: 'sf-text-sm' }, 'Row band'),
		h('span', { class: 'sf-chip sf-size-2xs sf-loudness-2' }, 'draft'),
		h('span', { class: 'sf-chip sf-size-2xs sf-loudness-2' }, 'saved'),
	])

const swatch = (extra = '') =>
	h('div', { class: `sl-bleed sf-bg-primary-5 ${extra}`, style: 'height: 40px' })

const edgePage = (margin: string) =>
	h(
		'div',
		{
			class: 'sl-inset sf-gap-md',
			style: `--sf-spacing_page: ${margin}; padding-block: 12px; outline: 1px dotted #8888`,
		},
		[
			h('p', { class: 'sf-text-xs sf-loudness-1' }, `Page margin ${margin}`),
			h('p', 'Page text sits on the line.'),
			swatch(),
			h(
				'div',
				{
					class: 'sl-bleed sl-inset sf-depth-1 sf-is-edge-left sf-is-edge-right sf-gap-xs',
				},
				[
					h('p', 'Stack band (sl-bleed sl-inset): on the line.'),
					swatch(),
				],
			),
			h(
				'div',
				{
					class: 'sl-bleed sl-inset-line sf-depth-1 sf-size-2xs sf-is-edge-left sf-is-edge-right',
				},
				[
					bandRow(),
				],
			),
			h('p', 'Table: first column on the line, scrolls to the edge, pinned column flush.'),
			h('div', { class: 'sl-bleed sf-depth-1 sf-flush sf-is-edge-left sf-is-edge-right' }, [
				h('div', { class: 'sl-scroll-x sl-inset-line' }, [wideTable()]),
			]),
			h('div', { class: 'sf-depth-1 sl-inset sf-gap-xs' }, [
				h('p', 'Card as inset: its own padding is the margin.'),
				swatch(),
				h('p', 'Back on the card line.'),
			]),
		],
	)

export const stories: Story[] = [
	{
		id: 'edge-alignment',
		title: 'Edge alignment — page line, bands, table',
		notes: 'At both margins: text, band content and the first table column share one line; colour bars reach the frame edges; table rows scroll to the edge; the ⋯ column stays pinned flush. The card bar reaches the card edges.',
		maxWidth: '360px',
		render: () => [edgePage('1.5rem'), edgePage('0.75rem')],
	},
	{
		id: 'admin-list',
		title: 'AdminList + AdminListItem',
		notes: 'Name loud (bold), slug muted mono xs, table text sm. Actions column pinned right.',
		render: adminList,
	},
	{
		id: 'admin-list-narrow',
		title: 'AdminList — narrow (forces horizontal scroll)',
		notes: 'At rest: content hidden on the right, so the pinned actions column should be opaque with a shadow onto the content and no right-edge fade. Scroll fully right: shadow goes. Scrolled left of end: left edge fades.',
		maxWidth: '320px',
		render: adminList,
	},
	{
		id: 'admin-list-states',
		title: 'AdminList — loading / empty',
		render: () => [
			h(AdminList, { loading: true }),
			h(AdminList, { empty: true }, { empty: () => 'No pages found.' }),
		],
	},
	{
		id: 'account-header',
		title: 'AccountHeader',
		render: () =>
			h(AccountHeader, {
				profile: {
					sub: '1',
					name: 'Ada Lovelace',
					given_name: 'Ada',
					family_name: 'Lovelace',
					preferred_username: 'ada',
				} as never,
			}),
	},
	{
		id: 'status-display',
		title: 'SfStatusDisplay',
		render: () => [
			h(SfStatusDisplay, { state: 'loading' }),
			h(SfStatusDisplay, { state: 'empty' }),
			h(SfStatusDisplay, { state: 'error' }),
		],
	},
	{
		id: 'toolbar-icon',
		title: 'ToolbarIcon',
		render: () =>
			h(
				'div',
				{ class: 'sl-cluster sf-gap-sm' },
				['close', 'code', 'check', 'link_off'].map((n) => h(ToolbarIcon, () => n)),
			),
	},
	{
		id: 'tooltip',
		title: 'SfTooltip (held open)',
		notes: "Text is the theme's xs size (was a fixed 11px). Mouse-opened tooltips sit a small theme gap (spacing-xs) from the button on every side; a touch-opened one above the button sits 40px clear so a thumb on the button doesn't hide it.",
		render: () =>
			h('div', { class: 'sl-cluster' }, [
				openTooltip('top', 'mouse', 'Close'),
				openTooltip('top', 'touch', 'Close'),
				openTooltip('bottom', 'mouse', 'Close'),
				openTooltip('left', 'mouse', 'Close'),
				openTooltip('right', 'mouse', 'Close'),
			]),
	},
	{
		id: 'toolbar-attr-row',
		title: 'ToolbarAttrRow (attribute panel)',
		notes: "The rows are sl-split sl-collapse-xs. The real panel (320px) is under the 380px collapse width, so each name sits above its field. The 480px copy has room, so names share one column as wide as the longest name and every field starts on the same line. Names line up with the add buttons' labels. Last: sl-row in a three-column sl-columns, for rows that aren't forms.",
		render: () => {
			const row = (attrKey: string, value: unknown, specDefault: unknown, extra = {}) =>
				h(ToolbarAttrRow, { attrKey, value, specDefault, ...extra })
			const add = (key: string) =>
				h(
					'button',
					{
						type: 'button',
						class: 'sf sf-is-contained sf-size-2xs sf-loudness-1 sf-on-hover',
						style: 'display: flex; align-items: center; gap: var(--sf-spacing-2xs); width: 100%',
					},
					[h('span', { class: 'material-symbols-rounded sf-icon' }, 'add'), key],
				)
			const cells = (...texts: string[]) =>
				h(
					'div',
					{ class: 'sl-row' },
					texts.map((t) => h('span', t)),
				)
			const panel = (width: string) =>
				h('div', { class: 'sf-depth-2', style: `width: ${width}` }, [
					h('div', { class: 'sl-stack sf-gap-2xs sf-size-2xs' }, [
						h('div', { class: 'sl-split sl-collapse-xs sf-gap-xs' }, [
							row('id', 'hero', null),
							row('align', 'center', 'left', {
								specOptions: ['left', 'center', 'right'],
							}),
							row('open', true, false),
							row('data-columns', 2, 2, { isAtDefault: true }),
						]),
						h('hr', { class: 'sf' }),
						add('href'),
						add('target'),
					]),
				])
			return h('div', { class: 'sl-stack sf-gap-lg' }, [
				panel('320px'),
				panel('480px'),
				h(
					'div',
					{
						class: 'sl-columns sf-gap-sm sf-text-sm',
						style: '--sl-cols: auto 1fr auto; width: 320px',
					},
					[
						cells('Cut', 'Remove the selection', '⌘X'),
						cells('Paste as plain text', 'Drop formatting', '⇧⌘V'),
						cells('Undo', 'Step back', '⌘Z'),
					],
				),
			])
		},
	},
	{
		id: 'layout-fit-content',
		title: 'Layout primitives in size-to-content spots',
		notes: 'Each row of chips should sit side by side, not one per line. The collapse demo: the 300px box shows one column, the 420px box two columns.',
		render: () => {
			const chips = ['alpha', 'beta', 'gamma'].map((t) =>
				h('span', { class: 'sf-chip sf-size-2xs sf-variant-featured sf-loudness-2' }, t),
			)
			const label = (text: string) => h('p', { class: 'sf-text-xs sf-loudness-1' }, text)
			const columns = (width: string) =>
				h('div', { class: 'sl-stack', style: `width: ${width}` }, [
					h('div', { class: 'sl-columns sl-collapse-xs sf-gap-sm' }, [
						h('div', { class: 'sf-depth-1 sf-size-xs' }, 'One'),
						h('div', { class: 'sf-depth-1 sf-size-xs' }, 'Two'),
					]),
				])
			return h('div', { class: 'sl-stack sf-gap-lg' }, [
				h('div', { class: 'sl-stack sf-gap-2xs' }, [
					label('sl-cluster inside a table cell'),
					h('table', { class: 'sf' }, [
						h('tbody', [
							h('tr', [
								h('td', 'Row'),
								h('td', [h('div', { class: 'sl-cluster sf-gap-2xs' }, chips)]),
							]),
						]),
					]),
				]),
				h('div', { class: 'sl-stack sf-gap-2xs' }, [
					label('sl-cluster inside a button'),
					h('div', [
						h('button', { class: 'sf sf-is-contained sf-size-2xs sf-on-hover' }, [
							h('span', { class: 'sl-cluster sf-gap-2xs' }, chips),
						]),
					]),
				]),
				h('div', { class: 'sl-stack sf-gap-2xs' }, [
					label('sl-stack inside an auto-width box (like a dropdown)'),
					h('div', { style: 'display: inline-block' }, [
						h('div', { class: 'sl-stack sf-gap-2xs sf-depth-2 sf-size-xs' }, [
							h('span', 'First item'),
							h('span', 'Second, longer item'),
						]),
					]),
				]),
				h('div', { class: 'sl-stack sf-gap-2xs' }, [
					label('Collapse still works (sl-collapse-xs = 380px)'),
					h('div', { style: 'overflow-x: auto' }, [
						h('div', { class: 'sl-stack sf-gap-md' }, [
							columns('300px'),
							columns('420px'),
						]),
					]),
				]),
			])
		},
	},
	{
		id: 'inset-bleed',
		title: 'sl-inset + sl-bleed',
		notes: 'Page: heading and text keep the side margin; the bleed card touches both frame edges with square corners. Card: its padding becomes margins — the bar spans the card edge to edge, the text stays inset.',
		maxWidth: '360px',
		render: () => [
			h(SfPageShell, { title: 'Page' }, () => [
				h('p', 'Text keeps the page margin.'),
				h('div', { class: 'sl-bleed' }, [
					h(
						'div',
						{ class: 'sf-depth-1 sf-size-2xs sf-is-edge-left sf-is-edge-right' },
						'Bleeds to the page edges.',
					),
				]),
				h('p', 'Back inside the margin.'),
			]),
			h('div', { style: 'padding: 16px' }, [
				h('div', { class: 'sf-depth-1 sl-inset sf-gap-sm' }, [
					h('p', 'Card text, inside the padding.'),
					h('div', { class: 'sl-bleed sf-bg-primary-5', style: 'height: 48px' }),
					h('p', 'More card text.'),
				]),
			]),
		],
	},
	{
		id: 'modifier-wins',
		title: 'Modifiers beat what they modify',
		notes: 'Split: the short item sits at the bottom (sl-align-y-end beats sl-split’s own start alignment). Cover: the content sits at the top, not centred. Card: sf-size-2xs gives tight padding over sf-depth-1’s default.',
		maxWidth: '360px',
		render: () => [
			h('div', { class: 'sl-stack sf-gap-md', style: 'padding: 16px' }, [
				h('div', { class: 'sl-split sl-align-y-end sf-gap-sm sf-depth-1' }, [
					h('span', { class: 'sf-bg-primary-5' }, 'Short'),
					h('p', 'A taller item that wraps over several lines so the row has height.'),
				]),
				h(
					'div',
					{
						class: 'sl-cover sl-align-y-start sf-depth-1',
						style: '--sl-cover-min: 8rem',
					},
					[h('p', 'At the top of the cover.')],
				),
				h('div', { class: 'sf-depth-1 sf-size-2xs' }, 'Tight card padding.'),
			]),
		],
	},
	{
		id: 'cluster-scroll',
		title: 'A cluster that scrolls stays on one line',
		notes: 'Top: sl-cluster wraps onto new lines. Bottom: the same cluster with sl-scroll-x stays on one line and scrolls sideways; “Bullet list” stays on one line inside its chip instead of being squeezed onto two.',
		maxWidth: '240px',
		render: () => {
			const items = ['One', 'Bullet list', 'Three', 'Four', 'Five', 'Six'].map((t) =>
				h('span', { class: 'sf-chip sf-loudness-2' }, t),
			)
			return h('div', { class: 'sl-stack sf-gap-md', style: 'padding: 16px' }, [
				h('div', { class: 'sl-cluster sf-gap-2xs' }, items),
				h('div', { class: 'sl-cluster sl-scroll-x sf-gap-2xs' }, items),
			])
		},
	},
	{
		id: 'basic-card',
		title: 'Basic card',
		notes: 'Left: a card with a picture, cut to the rounded corners. Right: no picture — the faded logo centred. Both keep a 4:3 box.',
		maxWidth: '520px',
		render: () =>
			h('div', { class: 'sl-grid sf-gap-md', style: '--sl-min: 14rem' }, [
				h(BasicCard, {
					imageUrl:
						"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g'%3E%3Cstop offset='0' stop-color='%23c06'/%3E%3Cstop offset='1' stop-color='%2306c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23g)'/%3E%3C/svg%3E",
					title: 'With a picture',
				}),
				h(BasicCard, { imageUrl: '', title: 'Coming Soon!' }),
			]),
	},
	{
		id: 'collection-grid',
		title: 'Collection grid at page widths',
		notes: 'The real CollectionGrid (6 cards) in a page inset at 375, 768, 1024, 1280, 1600 and 1920px screens, scaled down to fit: 1, 3, 4, 5, 5, 5 columns. From 1600 the content stops at the page width (80rem) and centres — the dotted outline is the screen, the band still reaches its edges. Placeholder cards need the running page, so they don’t show here.',
		render: () => {
			const items = Array.from({ length: 6 }, (_, i) => ({
				imageUrl: '',
				title: `Page ${i + 1}`,
			}))
			const widths = [375, 768, 1024, 1280, 1600, 1920]
			return h(
				'div',
				{ class: 'sl-stack sf-gap-md', style: 'padding: 16px' },
				widths.map((w) =>
					h('div', { class: 'sl-stack sf-gap-2xs' }, [
						h('p', { class: 'sf-text-xs sf-loudness-1' }, `${w}px screen`),
						h(
							'div',
							{
								class: 'sl-inset',
								style: `width: ${w}px; zoom: ${Math.min(1, 300 / w)}; outline: 1px dotted #8888`,
							},
							[
								h('div', {
									class: 'sl-bleed sf-bg-primary-5',
									style: 'height: 24px',
								}),
								h(CollectionGrid, { items }),
							],
						),
					]),
				),
			)
		},
	},
	{
		id: 'scroll-frame',
		title: 'Framed scroll areas',
		notes: 'Scroll each row. Top and middle are framed: an arrow shows on each side with hidden content (middle starts scrolled halfway, so both). Bottom: the same row unframed — fade only.',
		maxWidth: '240px',
		render: () => {
			const words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight']
			const items = () =>
				words.map((t) => h('span', { class: 'sf-chip sf-loudness-2' }, `Item ${t}`))
			const row = (overflow: string, props: Record<string, unknown> = {}) =>
				h(
					'div',
					{ class: `sl-cluster sl-scroll-x sf-gap-2xs ${overflow}`, ...props },
					items(),
				)
			return h('div', { class: 'sl-stack sf-gap-md', style: 'padding: 16px' }, [
				h('div', { class: 'sl-scroll-frame sf-depth-1 sf-flush' }, [
					row('sf-is-overflow-right'),
				]),
				h('div', { class: 'sl-scroll-frame sf-depth-1 sf-flush' }, [
					// preview.js syncs overflow classes from the scroll position; start mid-way.
					row('sf-is-overflow-left sf-is-overflow-right', {
						'data-preview-scroll': 'middle',
					}),
				]),
				h('div', { class: 'sf-depth-1 sf-flush' }, [row('sf-is-overflow-right')]),
			])
		},
	},
	{
		id: 'stackable-sheet',
		title: 'StackableSheet',
		notes: 'Desktop layout inside a framed box (transform makes the fixed sheet sit in the frame). The X sits in its own row at the top right, is a real button (tab to it), and stays put while the body scrolls. The long heading wraps below the X instead of running under it.',
		render: () => {
			useStackableSheetStore().isSheetOpen = true
			return h(
				'div',
				{
					style: 'position: relative; height: 360px; transform: translateZ(0); overflow: hidden; outline: 1px dotted #8888',
				},
				[
					h(StackableSheet, { mobileHeight: '50%', desktopWidth: '65%' }, () =>
						h('div', { class: 'sl-stack sf-gap-sm' }, [
							h(
								'h3',
								{ class: 'sf-text-xl' },
								'Marker details with a fairly long title',
							),
							...Array.from({ length: 12 }, (_, i) =>
								h('p', `Line ${i + 1} of the sheet body — scroll to see the rest.`),
							),
						]),
					),
				],
			)
		},
	},
	{
		id: 'node-path',
		title: 'NodePath',
		notes: 'Scrolls horizontally (sl-scroll-x); edges fade when content is hidden.',
		maxWidth: '220px',
		render: () =>
			h(NodePath, {
				editor: fakeEditor([
					'doc',
					'layout-columns',
					'layout-stack',
					'paragraph',
					'text-block',
				]) as never,
			}),
	},
]
