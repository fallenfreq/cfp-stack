<template>
  <Transition appear name="slide">
    <div v-if="sheetStore.isSheetOpen" class="sheet z-20 bg-backgroundSecondary">
      <div class="close-button">
        <FontAwesomeIcon @click="sheetStore.closeSheet" size="sm" :icon="faXmark" />
      </div>

      <slot></slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useStackableSheetStore } from '@/stores/sheetStore'
const sheetStore = useStackableSheetStore()
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  mobileHeight: string
  desktopWidth: string
}>()
</script>

<style scoped>
.sheet {
  position: fixed;
  overflow-y: auto;
  padding: 30px;
  box-shadow: 0 2px 50px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease-in-out;
  ::-webkit-scrollbar {
    display: none;
  }
}

/* Close button styling */
.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
}

/* Media query for mobile */
@media (max-width: 768px) {
  .sheet {
    bottom: 0;
    left: 0;
    right: 0;
    height: v-bind(mobileHeight);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }
  /* Slide transition for mobile */
  .slide-enter-from,
  .slide-leave-to {
    transform: translateY(100%);
  }
}

/* Media query for desktop */
@media (min-width: 769px) {
  .sheet {
    top: 0;
    right: 0;
    bottom: 0;
    width: v-bind(desktopWidth);
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
  }
  /* Slide transition for desktop */
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(100%);
  }
}
</style>
