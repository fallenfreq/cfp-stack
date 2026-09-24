<template>
	<Transition appear name="slide">
		<div
			v-if="sheetStore.isSheetOpen"
			class="sheet sl-stack sf-depth-3 sf-size-lg"
			:class="
				isBelowThreshold
					? ['sheet--mobile', 'sf-is-edge-bottom']
					: ['sheet--desktop', 'sf-is-edge-top', 'sf-is-edge-right', 'sf-is-edge-bottom']
			"
		>
			<!-- Top row stays put while the body scrolls, so the close control never
			     scrolls away or covers content. -->
			<div class="sheet-bar sl-cluster">
				<SfIconButton
					icon="x"
					tooltip="Close"
					class="sf-is-contained sf-loudness-1"
					@click="sheetStore.closeSheet"
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
import { onMounted, onUnmounted } from 'vue'
const sheetStore = useStackableSheetStore()
const { isBelowThreshold } = useCollapseBreakpoint('md')

defineProps<{
	mobileHeight: string
	desktopWidth: string
}>()

// Escape closes the sheet. No focus trap: the sheet doesn't block the page behind it.
const onKeyDown = (e: KeyboardEvent) => {
	if (e.key === 'Escape' && sheetStore.isSheetOpen) sheetStore.closeSheet()
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))
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
