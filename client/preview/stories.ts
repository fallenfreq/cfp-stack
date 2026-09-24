// Preview stories: real components rendered with sample props. Markup in slots mirrors the
// real consumers (e.g. AdminPagesView) so the preview shows what the app renders.
import AccountHeader from '@/components/account/AccountHeader.vue'
import AdminList from '@/components/admin/AdminList.vue'
import AdminListItem from '@/components/admin/AdminListItem.vue'
import NodePath from '@/components/editor/NodePath.vue'
import ToolbarIcon from '@/components/editor/toolbar/ToolbarIcon.vue'
import StackableSheet from '@/components/layout/StackableSheet.vue'
import SfPageShell from '@/components/ui/SfPageShell.vue'
import SfStatusDisplay from '@/components/ui/SfStatusDisplay.vue'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { h, type VNode } from 'vue'

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
