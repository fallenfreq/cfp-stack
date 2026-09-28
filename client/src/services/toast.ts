import { shallowReactive } from 'vue'

// Short messages that pop up over the page and go by themselves (SfToasts shows them).
// Plain functions, so they work outside components (the query client, editor utils).

export type ToastVariant = 'danger' | 'warning' | 'success' | 'info'

export interface Toast {
	id: number
	message: string
	variant: ToastVariant | undefined
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

/** Show a message. duration is in ms; 0 keeps it until closed. */
export function notify({
	message,
	variant,
	duration = 5000,
}: {
	message: string
	variant?: ToastVariant | undefined
	duration?: number
}): void {
	const id = nextId++
	toasts.push({ id, message, variant })
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
