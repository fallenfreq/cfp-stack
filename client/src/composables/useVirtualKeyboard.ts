/**
 * dismiss() — on touch devices, blurs the active element to dismiss the
 * virtual keyboard. On iOS, window.innerHeight doesn't shrink with the
 * keyboard, so we detect this case and wait for visualViewport to settle
 * before resolving. On Android, innerHeight already reflects the keyboard
 * height so we resolve immediately and let the window resize event handle
 * any follow-up reposition.
 * Returns immediately on desktop (no touch points).
 *
 * restore() — refocuses the element that was blurred by dismiss(), if it is
 * still in the DOM. ProseMirror persists selection in state across blur, so
 * re-focusing the editor DOM node is enough to restore the cursor position.
 */
export function useVirtualKeyboard() {
	let dismissedEl: HTMLElement | null = null

	const dismiss = (): Promise<void> => {
		if (navigator.maxTouchPoints === 0 || !(document.activeElement instanceof HTMLElement)) {
			return Promise.resolve()
		}

		dismissedEl = document.activeElement
		dismissedEl.blur()

		// iOS only: visualViewport.height < window.innerHeight when keyboard is up.
		// Wait for the viewport to settle so reposition uses the correct height.
		// On Android both heights already match, so we can resolve immediately.
		const vvp = window.visualViewport
		if (!vvp || window.innerHeight - vvp.height <= 50) {
			return Promise.resolve()
		}

		return new Promise<void>((resolve) => {
			const onResize = () => {
				clearTimeout(fallback)
				resolve()
			}
			// Fallback in case the resize event never fires (e.g. keyboard was
			// already mid-dismiss when blur ran).
			const fallback = setTimeout(() => {
				vvp.removeEventListener('resize', onResize)
				resolve()
			}, 500)
			vvp.addEventListener('resize', onResize, { once: true })
		})
	}

	const restore = () => {
		if (dismissedEl?.isConnected) {
			dismissedEl.focus()
		}
		dismissedEl = null
	}

	return { dismiss, restore }
}
