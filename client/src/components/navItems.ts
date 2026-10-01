import { type Component, h } from 'vue'
import MaterialIcon from './ui/MaterialIcon.vue'

// A link or command in SiteNav. Give it exactly one of to or action.
export interface NavLink {
	// Always required: icon-only items use it as their name and tooltip.
	title: string
	// A Material Symbols name, or a component that draws the icon itself (e.g. one that
	// shows whether you're signed in). Wrap a component in markRaw.
	icon?: string | Component
	to?: string
	action?: () => void
}

// A top-level SiteNav entry: a link, a command, or a group of links. Groups go one level
// deep — a site's main nav stays short; deeper structure belongs to the section itself.
export interface NavItem extends NavLink {
	children?: NavLink[]
	// Stays in the bar at every width instead of moving into the narrow menu.
	alwaysShown?: boolean
	// Shows only the icon in the bar.
	iconOnly?: boolean
}

// A group the current page sits in.
export const isAncestor = (item: NavItem, path: string) =>
	!!item.children?.some((child) => child.to === path)

// Draws an item's icon, whichever form it came in.
export const NavIcon = ({ icon }: { icon?: string | Component | undefined }) =>
	!icon ? null : typeof icon === 'string' ? h(MaterialIcon, () => icon) : h(icon)
NavIcon.props = ['icon']
