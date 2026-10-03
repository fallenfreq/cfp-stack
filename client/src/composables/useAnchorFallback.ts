import { onBeforeUnmount, watch, type Ref } from 'vue'

/**
 * Places a popover against its trigger from script, in browsers without anchor positioning
 * (Safari 17.4–18). Elsewhere it does nothing: the component's CSS places the box. Without it the
 * browser puts a popover in the middle of the screen (or, with no margin, in its corner).
 *
 * It follows the same rules as the CSS, so a box sits in the same place in every browser: on its
 * side of the trigger, lined up with its start or end edge (else the other edge, else the other
 * side), or centred on it and slid back on screen. A box that fits beside neither edge spreads
 * across the screen within its edges, centred on the trigger. Where it fits nowhere, it stays in
 * the last place it fitted since it opened (else its first), slid onto the screen at the sides and
 * the top; it runs off the bottom, where scrolling the page brings it into view, unless the page
 * doesn't scroll. While it's open it's checked every frame, before the frame is drawn, as CSS
 * anchoring is: it's placed again when the trigger moves, its content changes size or the screen
 * does.
 */
export interface AnchorPlacement {
	// The side of the trigger it goes on; the other side when there's no room.
	side: 'top' | 'bottom' | 'left' | 'right'
	// Along that side: lined up with the trigger's start or end edge, or centred on it.
	align: 'start' | 'end' | 'center'
	// CSS lengths: the room between trigger and box, and the room it keeps at the screen's sides
	// when it's slid back or spread across the screen.
	gap: string
	edge: string
	// Spread across the screen when it fits beside neither edge (popovers).
	wide?: boolean
	// Never taller than the screen less the trigger, so scrolling the page can bring it all into
	// view (popovers).
	fitScreen?: boolean
}

// One place the box can go: a side of the trigger, and where along it.
interface Place {
	side: AnchorPlacement['side']
	align: AnchorPlacement['align'] | 'wide'
}

const SUPPORTED = typeof CSS !== 'undefined' && CSS.supports('position-area', 'block-end')

const OTHER_SIDE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const
const OTHER_EDGE = { start: 'end', end: 'start', center: 'center' } as const

export function useAnchorFallback(
	box: Ref<HTMLElement | null>,
	trigger: () => Element | null,
	placement: () => AnchorPlacement,
): void {
	if (SUPPORTED) return

	let frame = 0
	let placedFor = ''
	// The last place the box fitted since it opened: where it stays while it fits nowhere.
	let fitted: Place | null = null
	// Runs every frame while the box is open; it stops once the box has closed, whether by an
	// event or by leaving the page.
	const follow = () => {
		const el = box.value
		const anchor = trigger()
		if (!el?.isConnected || !el.matches(':popover-open') || !anchor) {
			frame = 0
			return
		}
		// Where the trigger is, how big the box's content is, and the screen's size.
		const state = () => {
			const t = anchor.getBoundingClientRect()
			const screen = document.documentElement
			return [t.left, t.top, t.width, t.height, el.scrollWidth, el.scrollHeight]
				.concat(screen.clientWidth, screen.clientHeight)
				.join()
		}
		if (state() !== placedFor) {
			fitted = place(el, anchor, placement(), fitted)
			placedFor = state()
		}
		frame = requestAnimationFrame(follow)
	}
	const onBeforeToggle = (event: Event) => {
		if ((event as ToggleEvent).newState !== 'open') return
		placedFor = ''
		fitted = null
		if (!frame) frame = requestAnimationFrame(follow)
	}

	watch(
		box,
		(el, old) => {
			old?.removeEventListener('beforetoggle', onBeforeToggle)
			el?.addEventListener('beforetoggle', onBeforeToggle)
		},
		{ immediate: true },
	)
	onBeforeUnmount(() => {
		box.value?.removeEventListener('beforetoggle', onBeforeToggle)
		cancelAnimationFrame(frame)
	})
}

/** Puts the box in the first place it fits and returns that place. Where it fits nowhere, it goes
 * in the place it last fitted (else its first), and that stays the last place it fitted. */
function place(
	box: HTMLElement,
	trigger: Element,
	p: AnchorPlacement,
	fitted: Place | null,
): Place | null {
	const gap = lengthIn(box, p.gap)
	const edge = lengthIn(box, p.edge)
	const screen = document.documentElement
	const [width, height] = [screen.clientWidth, screen.clientHeight]
	const t = trigger.getBoundingClientRect()
	// The CSS's start and end follow the screen's direction (its containing block), not the box's.
	const rtl = getComputedStyle(screen).direction === 'rtl'
	// Spreading it across the screen and back rewraps it, which can lose its scroll position.
	const scrolled = box.scrollTop

	Object.assign(box.style, {
		margin: '0',
		inset: 'auto',
		inlineSize: 'max-content',
		maxBlockSize: p.fitScreen ? `${Math.max(0, height - t.height - 2 * gap)}px` : '',
	})
	// Its size in a place: spread across the screen, it's no wider than the screen within its edges.
	const sized = ({ align }: Place) => {
		box.style.maxInlineSize = align === 'wide' ? `${width - 2 * edge}px` : ''
		return box.getBoundingClientRect()
	}
	const put = ({ left, top }: { left: number; top: number }) => {
		Object.assign(box.style, { left: `${left}px`, top: `${top}px` })
		box.scrollTop = scrolled
	}
	const slid = (at: number, length: number, room: number) =>
		Math.max(edge, Math.min(at, room - edge - length))

	// Where the box goes in a place, at that size.
	const spot = ({ side, align }: Place, size: DOMRect) => {
		if (side === 'top' || side === 'bottom') {
			const start = rtl ? t.right - size.width : t.left
			const end = rtl ? t.left : t.right - size.width
			const centred = slid(t.left + (t.width - size.width) / 2, size.width, width)
			return {
				left: align === 'start' ? start : align === 'end' ? end : centred,
				top: side === 'bottom' ? t.bottom + gap : t.top - gap - size.height,
			}
		}
		const centred = slid(t.top + (t.height - size.height) / 2, size.height, height)
		return {
			left: side === 'right' ? t.right + gap : t.left - gap - size.width,
			top: align === 'start' ? t.top : align === 'end' ? t.bottom - size.height : centred,
		}
	}

	const fits = ({ left, top }: { left: number; top: number }, size: DOMRect) =>
		left >= 0 && top >= 0 && left + size.width <= width && top + size.height <= height

	// On its side, lined up with its edge, else the other edge, else the same on the other side;
	// then spread across the screen below, else above.
	const edges = [...new Set([p.align, OTHER_EDGE[p.align]])]
	const places: Place[] = [p.side, OTHER_SIDE[p.side]].flatMap((side) =>
		edges.map((align) => ({ side, align })),
	)
	if (p.wide) places.push({ side: 'bottom', align: 'wide' }, { side: 'top', align: 'wide' })
	for (const option of places) {
		const size = sized(option)
		const at = spot(option, size)
		if (fits(at, size)) {
			put(at)
			return option
		}
	}

	// Fits nowhere: slid onto the screen at the sides (the left winning) and the top, with
	// its margins: the gap on the trigger's side, and the screen's edges when spread. At the bottom
	// only when the page doesn't scroll, as the CSS does; otherwise scrolling brings it into view.
	const option = fitted ?? places[0]!
	const size = sized(option)
	const at = spot(option, size)
	const inset = option.align === 'wide' ? edge : 0
	const gapOn = (side: Place['side']) => (option.side === side ? gap : 0)
	const margin = {
		top: gapOn('bottom'),
		bottom: gapOn('top'),
		left: inset + gapOn('right'),
		right: inset + gapOn('left'),
	}
	const top =
		screen.scrollHeight > height
			? at.top
			: Math.min(at.top, height - margin.bottom - size.height)
	put({
		left: Math.max(margin.left, Math.min(at.left, width - margin.right - size.width)),
		top: Math.max(margin.top, top),
	})
	return fitted
}

// A CSS length in pixels, as it works out inside `within` (so its custom properties apply).
function lengthIn(within: Element, length: string): number {
	const probe = document.createElement('div')
	probe.style.cssText = `position: absolute; visibility: hidden; inline-size: ${length}`
	within.appendChild(probe)
	const px = probe.getBoundingClientRect().width
	probe.remove()
	return px
}
