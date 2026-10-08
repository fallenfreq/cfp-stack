import { shallowReactive } from 'vue'

// Short messages that pop up over the page and go by themselves (SfToasts shows them).
// Plain functions, so they work outside components (the query client, editor utils).

export type ToastVariant = 'danger' | 'warning' | 'success' | 'info'

export interface Toast {
	id: number
	message: string
	variant: ToastVariant | undefined
	// How many times it has been shown while on screen.
	count: number
}

export const toasts = shallowReactive<Toast[]>([])

interface Timer {
	remaining: number
	started: number
	timeout?: ReturnType<typeof setTimeout>
}
const timers = new Map<number, Timer>()
let nextId = 0

// While the pointer or focus is on the toasts their timers stop, so there's time to read.
const holds = { hover: false, focus: false }
const held = () => holds.hover || holds.focus

function run(id: number, timer: Timer) {
	timer.started = Date.now()
	timer.timeout = setTimeout(() => dismiss(id), timer.remaining)
}

/**
 * Show a message for duration ms (0 keeps it until closed): by default an error 10 s, else 5 s.
 * The same message again, while it's on screen, counts on that toast and starts its time again.
 */
export function notify({
	message,
	variant,
	duration = variant === 'danger' ? 10000 : 5000,
}: {
	message: string
	variant?: ToastVariant | undefined
	duration?: number
}): void {
	const index = toasts.findIndex(
		(toast) => toast.message === message && toast.variant === variant,
	)
	const shown = toasts[index]
	const id = shown ? shown.id : nextId++
	// Replaced, not changed in place: the list only notices what's put in it.
	if (shown) toasts.splice(index, 1, { ...shown, count: shown.count + 1 })
	else toasts.push({ id, message, variant, count: 1 })
	clearTimeout(timers.get(id)?.timeout)
	timers.delete(id)
	if (!duration) return
	const timer: Timer = { remaining: duration, started: 0 }
	timers.set(id, timer)
	if (!held()) run(id, timer)
}

export function dismiss(id: number): void {
	clearTimeout(timers.get(id)?.timeout)
	timers.delete(id)
	const index = toasts.findIndex((toast) => toast.id === id)
	if (index !== -1) toasts.splice(index, 1)
}

export function holdToasts(kind: keyof typeof holds, on: boolean): void {
	const wasHeld = held()
	holds[kind] = on
	if (wasHeld === held()) return
	for (const [id, timer] of timers) {
		if (on) {
			clearTimeout(timer.timeout)
			timer.remaining -= Date.now() - timer.started
		} else {
			run(id, timer)
		}
	}
}
