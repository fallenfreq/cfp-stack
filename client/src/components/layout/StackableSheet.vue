<template>
	<Transition appear name="slide">
		<div
			v-if="isOpen"
			ref="sheetEl"
			class="sheet sl-stack sf-depth-3 sf-size-lg"
			role="dialog"
			aria-modal="false"
			:aria-label="label"
			tabindex="-1"
			:class="
				isBelowThreshold
					? ['sheet--mobile', 'sf-is-edge-bottom']
					: ['sheet--desktop', 'sf-is-edge-top', 'sf-is-edge-right', 'sf-is-edge-bottom']
			"
			@keydown.esc="close"
		>
			<!-- Top row stays put while the body scrolls, so the close control never
			     scrolls away or covers content. -->
			<div class="sheet-bar sl-cluster">
				<SfIconButton
					icon="x"
					tooltip="Close"
					class="sf-is-contained sf-loudness-1"
					@click="close"
				/>
			</div>

			<div class="sheet-body sl-scroll-y">
				<slot />
			</div>
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { useCollapseBreakpoint } from '@/composables/useCollapseBreakpoint'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
const sheetStore = useStackableSheetStore()
const { isBelowThreshold } = useCollapseBreakpoint('md')

const props = withDefaults(
	defineProps<{
		mobileHeight: string
		desktopWidth: string
		// Given: the parent decides when the sheet shows and handles `close`.
		// Left out: the shared sheet store does.
		open?: boolean | null
		// The sheet's name for screen readers, e.g. the title of what it shows.
		label?: string | undefined
	}>(),
	{ open: null },
)

const emit = defineEmits<{ close: [] }>()

const isOpen = computed(() => props.open ?? sheetStore.isSheetOpen)

const close = () => {
	if (props.open === null) sheetStore.closeSheet()
	emit('close')
}

// Focus moves into the sheet when it opens and back to where it came from when it
// closes — but only if it's still in the sheet, so it never pulls focus from elsewhere.
// No focus trap: the sheet doesn't block the page behind it. Escape (on the sheet)
// closes it.
const sheetEl = ref<HTMLElement | null>(null)
let returnFocusTo: HTMLElement | null = null

watch(isOpen, async (open) => {
	if (open) {
		const active = document.activeElement
		returnFocusTo = active instanceof HTMLElement && active !== document.body ? active : null
		await nextTick()
		sheetEl.value?.focus()
		return
	}
	const focusInSheet = sheetEl.value?.contains(document.activeElement) ?? false
	if (focusInSheet && returnFocusTo?.isConnected) returnFocusTo.focus()
	returnFocusTo = null
})

// Open from the start (e.g. a copied link): nothing to return to, just move focus in.
onMounted(() => {
	if (isOpen.value) sheetEl.value?.focus()
})
</script>

<style scoped>
@layer ui {
	.sheet {
		position: fixed;
		z-index: var(--z-panel);
		transition: transform 0.3s ease-in-out;
	}

	/* Flex rows right-align with justify-content (sl-align-x-* is grid-only). */
	.sheet-bar {
		justify-content: end;
	}

	/* The body takes the rest of the sheet's height and scrolls inside it. */
	.sheet-body {
		flex: 1;
		min-height: 0;
	}

	/* Layout driven by isBelowThreshold (md collapse threshold from DB) — no hardcoded breakpoints */
	.sheet--mobile {
		bottom: 0;
		left: 0;
		right: 0;
		height: v-bind(mobileHeight);
	}
	.slide-enter-from:is(.sheet--mobile),
	.slide-leave-to:is(.sheet--mobile) {
		transform: translateY(100%);
	}

	.sheet--desktop {
		top: 0;
		right: 0;
		bottom: 0;
		width: v-bind(desktopWidth);
	}
	.slide-enter-from:is(.sheet--desktop),
	.slide-leave-to:is(.sheet--desktop) {
		transform: translateX(100%);
	}
}
</style>
