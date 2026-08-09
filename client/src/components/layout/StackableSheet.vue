<template>
	<Transition appear name="slide">
		<div
			v-if="sheetStore.isSheetOpen"
			class="sheet z-20 sf-depth-3 sf-size-lg"
			:class="
				isBelowThreshold
					? ['sheet--mobile', 'sf-is-edge-bottom']
					: ['sheet--desktop', 'sf-is-edge-top', 'sf-is-edge-right', 'sf-is-edge-bottom']
			"
		>
			<div class="close-button">
				<FontAwesomeIcon size="sm" :icon="faXmark" @click="sheetStore.closeSheet" />
			</div>

			<slot />
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { useCollapseBreakpoint } from '@/composables/useCollapseBreakpoint'
import { useStackableSheetStore } from '@/stores/stackableSheetStore'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
const sheetStore = useStackableSheetStore()
const { isBelowThreshold } = useCollapseBreakpoint('md')

defineProps<{
	mobileHeight: string
	desktopWidth: string
}>()
</script>

<style scoped>
@layer ui {
	.sheet {
		position: fixed;
		overflow-y: auto;
		box-shadow: 0 2px 50px rgb(0 0 0 / var(--sf-alpha-5));
		transition: transform 0.3s ease-in-out;
		::-webkit-scrollbar {
			display: none;
		}
	}

	.close-button {
		position: absolute;
		top: 15px;
		right: 15px;
		background: transparent;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
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
