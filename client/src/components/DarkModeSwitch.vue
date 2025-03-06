<template>
  <VaSwitch
    v-model="store.isDarkMode"
    color="BackgroundSecondary"
    style="--va-switch-checker-background-color: #252723"
    @input="toggleDarkMode"
    :indeterminate="store.isPinkMode"
    :disabled="store.isPinkMode"
    size="small"
  >
    <template #innerLabel>
      <div class="va-text-center">
        <VaIcon
          :name="store.isDarkMode == null ? '' : store.isDarkMode ? 'dark_mode' : 'light_mode'"
        />
      </div>
    </template>
  </VaSwitch>
</template>

<script setup lang="ts">
import { useDarkModeStore } from '@/stores/darkModeStore'
const store = useDarkModeStore()
const { toggleDarkMode, togglePinkMode } = store
import { AddKeyCombo, RemoveKeyCombo, injectSafe } from '@/symbols'
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  console.log('Mounting a dark mode switch')
  const addKeyCombo = injectSafe(AddKeyCombo)
  addKeyCombo('Ctrl+Shift+K', togglePinkMode)
})

onUnmounted(() => {
  console.log('Unmounting a dark mode switch')
  const removeKeyCombo = injectSafe(RemoveKeyCombo)
  removeKeyCombo('Ctrl+Shift+K')
})
</script>
