<template>
	<SfPopover
		v-model:open="open"
		class="toolbar-panel sf-size-2xs"
		:class="{ 'is-waiting': waitingForKeyboard }"
		:align="align"
		@mousedown.stop
	>
		<template #trigger="trigger">
			<!-- A custom trigger spreads the slot props onto its own button. -->
			<slot name="trigger" v-bind="trigger">
				<ToolbarButton v-bind="trigger" :tooltip="tooltip" :variant="variant">
					<ToolbarIcon>{{ icon }}</ToolbarIcon>
				</ToolbarButton>
			</slot>
		</template>
		<slot />
	</SfPopover>
</template>

<script setup lang="ts">
import type { ButtonVariant } from '@/components/ui/SfButton.vue'
import { useVirtualKeyboard } from '@/composables/useVirtualKeyboard'
import { onUnmounted, ref, watch } from 'vue'

// A toolbar button that opens a panel. The panel is SfPopover; this adds the editor's
// needs: a tap inside the panel isn't an editor click (mousedown.stop), the trigger keeps
// the editor's focus on desktop (mousedown.prevent), and on touch screens the panel waits
// out of sight until the on-screen keyboard has gone, so it's placed against the full
// screen.
defineProps<{
	icon?: string
	tooltip: string
	align: 'start' | 'end'
	// The button's colour role, as SfButton's (a block's warnings: `warning`).
	variant?: ButtonVariant | undefined
}>()
const open = defineModel<boolean>('open', { required: true })

const { dismiss: dismissKeyboard, restore: restoreKeyboard } = useVirtualKeyboard()
const waitingForKeyboard = ref(false)

// With the keys on the page the editor takes Escape for itself (ProseMirror cancels it), so the
// browser doesn't close the panel: it closes here. Keys in a panel are the browser's, and its
// controls'.
const closeOnEscape = (event: KeyboardEvent) => {
	if (event.key !== 'Escape') return
	if (event.target instanceof Element && event.target.closest('[popover]')) return
	open.value = false
}

watch(open, async (isOpen) => {
	if (!isOpen) {
		document.removeEventListener('keydown', closeOnEscape)
		waitingForKeyboard.value = false
		restoreKeyboard()
		return
	}
	document.addEventListener('keydown', closeOnEscape)
	waitingForKeyboard.value = true
	await dismissKeyboard()
	// Closed (and maybe reopened) meanwhile: that open does its own wait.
	if (!open.value) return
	waitingForKeyboard.value = false
})

// Removing an open panel hides it without a close event, so hand the keyboard back here.
onUnmounted(() => {
	restoreKeyboard()
	document.removeEventListener('keydown', closeOnEscape)
})
</script>

<style>
@layer ui {
	.toolbar-panel {
		scrollbar-width: none;
	}

	.toolbar-panel::-webkit-scrollbar {
		display: none;
	}

	/* Out of sight while the keyboard goes. No fallbacks meanwhile: the screen is still
	   short, and a position picked now would stick once the keyboard has gone. */
	.toolbar-panel.is-waiting[popover] {
		visibility: hidden;
		pointer-events: none;
		position-try-fallbacks: none;
	}
}
</style>
