// Preview stories: real components rendered with sample props. Markup in slots mirrors the
// real consumers (e.g. AdminPagesView) so the preview shows what the app renders.
import AccountDetailsCard from '@/components/account/AccountDetailsCard.vue'
import AccountHeader from '@/components/account/AccountHeader.vue'
import AccountIcon from '@/components/account/AccountIcon.vue'
import EmailChangeCard from '@/components/account/EmailChangeCard.vue'
import AdminList from '@/components/admin/AdminList.vue'
import AdminListItem from '@/components/admin/AdminListItem.vue'
import BasicCard from '@/components/BasicCard.vue'
import MothBrand from '@/components/brand/MothBrand.vue'
import CollectionGrid from '@/components/CollectionGrid.vue'
import NodePath from '@/components/editor/NodePath.vue'
import ToolbarAttrRow from '@/components/editor/toolbar/ToolbarAttrRow.vue'
import ToolbarIcon from '@/components/editor/toolbar/ToolbarIcon.vue'
import StackableSheet from '@/components/layout/StackableSheet.vue'
import SfTooltip from '@/components/SfTooltip.vue'
import type { NavItem } from '@/components/siteNav'
import SiteNav from '@/components/SiteNav.vue'
import MaterialIcon from '@/components/ui/MaterialIcon.vue'
import SfIcon from '@/components/ui/SfIcon.vue'
import SfPageShell from '@/components/ui/SfPageShell.vue'
import SfPopover from '@/components/ui/SfPopover.vue'
import SfStatusDisplay from '@/components/ui/SfStatusDisplay.vue'
import SfSwitch from '@/components/ui/SfSwitch.vue'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import PagePreview from '@/views/PagePreview.vue'
import { h, markRaw, type VNode } from 'vue'

// EmailChangeCard reads its pending change from sessionStorage, which the server render
// lacks. Profile sub '2' has a change pending, so it shows the code step.
const stubSessionStorage = () => {
	const store = new Map([['cfp_pending_email_2', 'ada@new.example']])
	globalThis.sessionStorage ??= {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k),
	} as Storage
}

// SfTooltip only opens on hover/touch, which the static preview can't do. This builds its popup
// with the real classes, data attributes and scoped CSS, anchored to the trigger the same way;
// position: absolute stands in for the popover's top layer, which needs script to open.
let tipCount = 0
const openTooltip = (placement: string, input: 'mouse' | 'touch', label: string) => {
	const anchor = `--preview-tip-${tipCount++}`
	return h(
		'div',
		{ class: 'sl-stack sf-gap-2xs', style: 'align-items: center; padding: 72px 96px' },
		[
			h('span', { style: `display: inline-flex; anchor-name: ${anchor}` }, [
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
						style: `position: absolute; position-anchor: ${anchor}`,
					},
					label,
				),
			]),
			h('small', { class: 'sf-loudness-1' }, `${placement}, ${input}`),
		],
	)
}

export interface Story {
	id: string
	title: string
	/** What to look for — shown above the story. */
	notes?: string
	/** Constrain width to force overflow / narrow layouts. */
	maxWidth?: string
	/** The current page, for components that mark where you are. */
	route?: string
	render: () => VNode | VNode[]
}

const action = (label: string, extra = '') =>
	h(
		'button',
		{ class: `sf sf-is-contained sf-size-xs sf-text-sm sf-single-line sf-on-hover ${extra}` },
		label,
	)

// The tags cell as AdminPagesView builds it: chips on the trigger, a checkbox list in the
// popover. popovertarget needs no script, so the popover opens by click in the preview too.
const allTags = ['featured', 'news', 'updates', 'archive']
const tagsCell = (tags: string[]) =>
	h(
		SfPopover,
		{ class: 'sf-size-xs' },
		{
			trigger: (trigger: Record<string, unknown>) =>
				h(
					'button',
					{
						...trigger,
						type: 'button',
						class: 'sl-cluster sf-gap-2xs sf sf-is-contained sf-size-2xs sf-on-hover',
						'aria-label': `Tags: ${tags.join(', ') || 'none'}`,
					},
					tags.length
						? [
								...tags.slice(0, 2).map((t) =>
									h(
										'span',
										{
											class: 'sf-chip sf-size-2xs sf-loudness-2 sf-variant-primary',
										},
										t,
									),
								),
								tags.length > 2
									? h(
											'span',
											{ class: 'sf-chip sf-size-2xs sf-loudness-1' },
											`+${tags.length - 2}`,
										)
									: null,
							]
						: h('span', { class: 'sf-text-xs sf-loudness-1' }, '—'),
				),
			default: () =>
				h('div', { class: 'sl-stack sf-gap-xs' }, [
					h(
						'span',
						{ id: `tags-${tags.length}`, class: 'sf-text-sm sf-loudness-1' },
						'Tags',
					),
					h(
						'div',
						{
							role: 'group',
							'aria-labelledby': `tags-${tags.length}`,
							class: 'sl-stack sf-gap-2xs',
						},
						allTags.map((t) =>
							h('label', { class: 'sl-cluster sf-gap-xs' }, [
								h('input', {
									type: 'checkbox',
									class: 'sf',
									checked: tags.includes(t),
								}),
								t,
							]),
						),
					),
				]),
		},
	)

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
							meta: () => tagsCell(r.tags),
							actions: () =>
								[
									action('Edit'),
									h(
										'a',
										{
											href: '#',
											class: 'sf sf-is-contained sf-size-xs sf-text-sm sf-single-line sf-on-hover',
										},
										'Preview',
									),
									action('Delete', 'sf-variant-danger'),
								].map((item) => h('li', item)),
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

// App.vue's nav: the same items and brand. The preview's auth stand-in reads as signed in.
const navItems: NavItem[] = [
	{ title: 'Contact', icon: 'info', to: '/contact' },
	{
		title: 'Portfolio',
		icon: 'dashboard',
		children: [
			{ title: 'Branding', icon: 'view_comfy', to: '/c/branding' },
			{ title: 'Web & App Design', icon: 'view_comfy', to: '/c/web-design' },
		],
	},
	{
		title: 'Demo',
		icon: 'science',
		children: [
			{ title: 'Editor', icon: 'edit_note', to: '/demo/editor' },
			{ title: 'Map', icon: 'map', to: '/demo/map' },
		],
	},
	{
		title: 'Account',
		icon: markRaw(AccountIcon),
		iconOnly: true,
		alwaysShown: true,
		children: [
			{ title: 'Account', icon: 'account_circle', to: '/account' },
			{ title: 'Admin', icon: 'settings', to: '/admin' },
			{ title: 'Sign out', icon: 'exit_to_app', action: () => undefined },
		],
	},
]
const siteNav = () =>
	h(
		'header',
		{ class: 'app-header sl-inset' },
		h(
			SiteNav,
			{ items: navItems },
			{
				brand: () => h(MothBrand),
				end: () => h('span', { class: 'sf-text-xs sf-loudness-1' }, '[dark switch]'),
			},
		),
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
		id: 'page-preview',
		title: 'PagePreview — admin Edit link',
		notes: 'The whole view needs the router, the page query and tiptap, so this rebuilds the admin Edit link with its real classes and scoped CSS. It floats bottom-right on the page margin, over the text.',
		render: () =>
			h('div', { class: 'sl-stack sf-gap-sm' }, [
				...Array.from({ length: 12 }, () =>
					h(
						'p',
						'Published page content runs underneath the Edit link, which stays put in the corner while the page scrolls.',
					),
				),
				h(
					'a',
					{
						href: '#',
						class: 'preview-edit sf sf-depth-2 sf-is-overlay sf-size-xs sf-on-hover',
						[(PagePreview as { __scopeId?: string }).__scopeId ?? 'data-v-preview']: '',
					},
					'Edit',
				),
			]),
	},
	{
		id: 'site-nav',
		title: 'SiteNav — wide',
		notes: 'On /c/branding: Portfolio is marked as the group you are in, and Branding as the current page inside its dropdown. The account icon is brand-coloured (signed in). Tap the groups to open their dropdowns.',
		route: '/c/branding',
		render: siteNav,
	},
	{
		id: 'site-nav-phone',
		title: 'SiteNav — phone',
		notes: 'The logo shows what fits the space left beside the buttons: mark and wordmark, else the wordmark alone, else the mark alone. Below: the logo on its own at 180px, 120px and 80px wide.',
		route: '/c/branding',
		maxWidth: '360px',
		render: () => [
			siteNav(),
			...['180px', '120px', '80px'].map((width) =>
				h(
					'div',
					{ class: 'sf-boundary-left', style: `inline-size: ${width}` },
					h(MothBrand),
				),
			),
		],
	},
	{
		id: 'site-nav-narrow',
		title: 'SiteNav — narrow',
		notes: 'The nav is under 640px wide, so the links go into the menu button; the account icon and the end slot stay. In the menu, Portfolio starts open because the current page is in it; Demo opens and closes without closing the menu.',
		route: '/c/branding',
		maxWidth: '480px',
		render: siteNav,
	},
	{
		id: 'popover-placement',
		title: 'SfPopover — placement',
		notes: 'Tap each button. Narrow boxes line up with their button (end-aligned on the right). A wide box that fits neither side spans the screen width, centred on its button and slid back on screen, with the page margin each side. Buttons at the bottom open upwards.',
		render: () => {
			const wide =
				'A wide box: this text is long enough that on a phone it cannot fit beside the button on either side, so the box should go full width less the page margin.'
			const pop = (label: string, text: string, align: 'start' | 'end') =>
				h(
					SfPopover,
					{ class: 'sf-size-xs', align },
					{
						trigger: (trigger: Record<string, unknown>) =>
							h(
								'button',
								{
									...trigger,
									type: 'button',
									class: 'sf sf-loudness-2 sf-on-hover',
								},
								label,
							),
						default: () => h('p', { style: 'max-inline-size: 60ch' }, text),
					},
				)
			const row = (items: VNode[]) =>
				h(
					'div',
					{ class: 'sl-columns sf-gap-sm', style: '--sl-cols: auto 1fr auto' },
					items,
				)
			return h('div', { class: 'sl-stack sf-gap-md', style: 'min-height: 90vh' }, [
				row([pop('Narrow', 'Short.', 'start'), h('span'), pop('Narrow', 'Short.', 'end')]),
				row([
					pop('Wide', wide, 'start'),
					pop('Wide', wide, 'start'),
					pop('Wide', wide, 'end'),
				]),
				h('div', { style: 'flex: 1' }),
				row([pop('Wide', wide, 'start'), h('span'), pop('Wide', wide, 'end')]),
			])
		},
	},
	{
		id: 'account-view',
		title: 'AccountView',
		notes: "The account page's pieces: SfPageShell with AccountHeader in its header slot, then the two cards.",
		maxWidth: '900px',
		render: () => {
			stubSessionStorage()
			const profile = {
				sub: '284719365024',
				name: 'Ada Lovelace',
				given_name: 'Ada',
				family_name: 'Lovelace',
				preferred_username: 'ada',
				email: 'ada@example.com',
				email_verified: true,
				locale: 'en',
			} as never
			return h(SfPageShell, null, {
				header: () => h(AccountHeader, { profile }),
				default: () => [
					h(AccountDetailsCard, { profile }),
					h(EmailChangeCard, { profile }),
				],
			})
		},
	},
	{
		id: 'email-change-card',
		title: 'EmailChangeCard',
		notes: 'Idle (verified) and code-sent (unverified) states. The warning notice, a mismatched field (sf-is-error) and a busy button (sf-is-loading) only show mid-edit, so they are repeated below on their own.',
		maxWidth: '640px',
		render: () => {
			stubSessionStorage()
			const profile = (sub: string, verified: boolean) =>
				({ sub, email: 'ada@example.com', email_verified: verified }) as never
			return h('div', { class: 'sl-stack sf-gap-md' }, [
				h(EmailChangeCard, { profile: profile('1', true) }),
				h(EmailChangeCard, { profile: profile('2', false) }),
				h(
					'p',
					{ class: 'sf-depth-1 sf-loudness-2 sf-variant-warning sf-text-sm' },
					'This change takes effect immediately. If you cannot access the verification email sent to ada@new.example, you will be locked out until an admin resets your address.',
				),
				h('input', {
					class: 'sf sf-field sf-on-focus sf-is-error',
					'aria-invalid': 'true',
					value: 'ada@exmaple.com',
				}),
				h('div', { class: 'sl-cluster sf-gap-sm' }, [
					h(
						'button',
						{
							class: 'sf sf-loudness-3 sf-variant-primary sf-on-hover sf-on-disabled sf-is-loading',
							disabled: true,
							'aria-busy': 'true',
						},
						'Sending…',
					),
				]),
			])
		},
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
		id: 'switch',
		title: 'SfSwitch',
		notes: 'Rows: off / on / disabled off / disabled on. First row plain; second with label text; third the dark-mode switch: the knob shows where you are (sun or moon) and the free end of the track shows what you would switch to; last at sf-text-2xl to show it scales. Off is an outlined track with a muted knob; on tints the track and fills the knob primary. The preview is static, so clicking does not toggle, but hover, press and Tab focus show. Try the theme picker for dark and pink.',
		render: () => {
			const row = (make: (on: boolean, disabled: boolean) => VNode) =>
				h('div', { class: 'sl-cluster sf-gap-md' }, [
					make(false, false),
					make(true, false),
					make(false, true),
					make(true, true),
				])
			const icon = {
				thumb: ({ on }: { on: boolean }) =>
					h(MaterialIcon, () => (on ? 'dark_mode' : 'light_mode')),
				off: () => h(MaterialIcon, () => 'light_mode'),
				on: () => h(MaterialIcon, () => 'dark_mode'),
			}
			return h('div', { class: 'sl-stack sf-gap-md' }, [
				row((on, disabled) =>
					h(SfSwitch, { modelValue: on, disabled, 'aria-label': 'Published' }),
				),
				row((on, disabled) =>
					h(SfSwitch, { modelValue: on, disabled }, { default: () => 'Published' }),
				),
				row((on, disabled) =>
					h(SfSwitch, { modelValue: on, disabled, 'aria-label': 'Dark mode' }, icon),
				),
				row((on, disabled) =>
					h(
						SfSwitch,
						{
							modelValue: on,
							disabled,
							class: 'sf-text-2xl',
							'aria-label': 'Dark mode',
						},
						icon,
					),
				),
			])
		},
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
		notes: 'Desktop layout inside a framed box (transform makes the fixed sheet sit in the frame). The X sits in its own row at the top right, is a real button (tab to it), and stays put while the body scrolls. The long heading wraps below the X instead of running under it. The small muted line left of the X is the sheet’s title (its label), also what screen readers announce.',
		render: () => {
			useStackableSheetStore().isSheetOpen = true
			return h(
				'div',
				{
					style: 'position: relative; height: 360px; transform: translateZ(0); overflow: hidden; outline: 1px dotted #8888',
				},
				[
					h(
						StackableSheet,
						{ mobileHeight: '50%', desktopWidth: '65%', label: 'Shop redesign' },
						() =>
							h('div', { class: 'sl-stack sf-gap-sm' }, [
								h(
									'h3',
									{ class: 'sf-text-xl' },
									'Marker details with a fairly long title',
								),
								...Array.from({ length: 12 }, (_, i) =>
									h(
										'p',
										`Line ${i + 1} of the sheet body — scroll to see the rest.`,
									),
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
