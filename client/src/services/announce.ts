import { shallowReactive } from 'vue'

// Messages for screen readers only: read out once, never shown. SfAnnouncer shows them to
// screen readers; every modal dialog holds its own SfAnnouncer (see that component).
// Plain functions, so they work outside components.

export interface Announcement {
	id: number
	message: string
	// Sent while a modal dialog was open: only the copy inside a dialog reads it. Otherwise
	// only the page's copy does. So a copy never holds messages from before it could be heard.
	inModal: boolean
}

export const announcements = shallowReactive<Announcement[]>([])

// The open modal dialog, if any.
const openModal = () => document.querySelector<HTMLDialogElement>('dialog:modal')
let nextId = 0

/** Have screen readers read a message out, without moving focus. */
export function announce(message: string) {
	// Each message is added as a new line, so the same message twice is read twice. It is
	// removed after a while so moving through the page later doesn't find it again.
	const id = nextId++
	const modal = openModal()
	// Only a copy inside the modal can be heard while it's open.
	if (import.meta.env.DEV && modal && !modal.querySelector('.announcer')) {
		console.warn(
			'announce(): the open modal dialog has no <SfAnnouncer />, so this is not heard.',
		)
	}
	announcements.push({ id, message, inModal: modal !== null })
	setTimeout(() => {
		const index = announcements.findIndex((a) => a.id === id)
		if (index !== -1) announcements.splice(index, 1)
	}, 7000)
}
