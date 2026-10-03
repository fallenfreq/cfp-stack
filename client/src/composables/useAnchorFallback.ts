import { onBeforeUnmount, watch, type Ref } from 'vue'

/**
 * Places a popover against its trigger from script, in browsers without anchor positioning
 * (Safari 17.4–18). Elsewhere it does nothing: the component's CSS places the box. Without it the
 * browser puts a popover in the middle of the screen (or, with no margin, in its corner).
 *
 * It follows the same rules as the CSS, so a box sits in the same place in every browser: on its
 * side of the trigger, lined up with its start or end edge (else the other edge, else the other
 * side), or centred on it and slid back on screen. A box that fits beside neither edge spreads
 * across the screen within its edges, centred on the trigger; if it's too tall even then, it
 * scrolls. While it's open it's checked every frame, before the frame is drawn, as CSS anchoring
 * is: it's placed again when the trigger moves, its content changes size or the screen does.
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
	// Spread across the screen when it fits beside neither edge (popovers); otherwise it stays
	// in its first place.
	wide?: boolean
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
			place(el, anchor, placement())
			placedFor = state()
		}
		frame = requestAnimationFrame(follow)
	}
	const onBeforeToggle = (event: Event) => {
		if ((event as ToggleEvent).newState !== 'open') return
		placedFor = ''
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

function place(box: HTMLElement, trigger: Element, p: AnchorPlacement): void {
	const gap = lengthIn(box, p.gap)
	const edge = lengthIn(box, p.edge)
	const screen = document.documentElement
	const [width, height] = [screen.clientWidth, screen.clientHeight]
	const t = trigger.getBoundingClientRect()
	// The CSS's start and end follow the screen's direction (its containing block), not the box's.
	const rtl = getComputedStyle(screen).direction === 'rtl'
	// Measuring clears the box's height limit, which would lose its scroll position.
	const scrolled = box.scrollTop

	Object.assign(box.style, {
		margin: '0',
		inset: 'auto',
		inlineSize: 'max-content',
		maxInlineSize: '',
		maxBlockSize: '',
	})
	let size = box.getBoundingClientRect()
	const put = (left: number, top: number) => {
		Object.assign(box.style, { left: `${left}px`, top: `${top}px` })
		box.scrollTop = scrolled
	}
	const slid = (at: number, length: number, room: number) =>
		Math.max(edge, Math.min(at, room - edge - length))

	// Where the box goes on one side of the trigger, lined up with one edge or centred.
	const spot = (side: AnchorPlacement['side'], align: AnchorPlacement['align']) => {
		if (side === 'top' || side === 'bottom') {
			const start = rtl ? t.right - size.width : t.left
			const end = rtl ? t.left : t.right - size.width
			const centred = slid(t.left + (t.width - size.width) / 2, size.width, width)
			return {
				left: align === 'center' ? centred : align === 'start' ? start : end,
				top: side === 'bottom' ? t.bottom + gap : t.top - gap - size.height,
			}
		}
		const centred = slid(t.top + (t.height - size.height) / 2, size.height, height)
		return {
			left: side === 'right' ? t.right + gap : t.left - gap - size.width,
			top: align === 'center' ? centred : align === 'start' ? t.top : t.bottom - size.height,
		}
	}
	const fits = ({ left, top }: { left: number; top: number }) =>
		left >= 0 && top >= 0 && left + size.width <= width && top + size.height <= height

	const edges = [...new Set([p.align, OTHER_EDGE[p.align]])]
	const tries = [p.side, OTHER_SIDE[p.side]].flatMap((side) =>
		edges.map((align) => spot(side, align)),
	)
	const first = tries.find(fits) ?? (p.wide ? null : tries[0]!)
	if (first) return void put(first.left, first.top)

	// Fits beside neither edge: across the screen within its edges, centred on the trigger;
	// below, else above, else below and scrolling.
	box.style.maxInlineSize = `${width - 2 * edge}px`
	size = box.getBoundingClientRect()
	const left = slid(t.left + (t.width - size.width) / 2, size.width, width)
	const below = t.bottom + gap
	const above = t.top - gap - size.height
	if (below + size.height <= height) return void put(left, below)
	if (above >= 0) return void put(left, above)
	box.style.maxBlockSize = `${Math.max(0, height - below)}px`
	put(left, below)
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
