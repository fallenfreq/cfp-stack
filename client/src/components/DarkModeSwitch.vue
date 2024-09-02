<template>
  <VaSwitch
    v-model="DarkModeStore.isDarkMode"
    color="BackgroundSecondary"
    style="--va-switch-checker-background-color: #252723"
    @input="toggleDarkMode"
    :indeterminate="isPinkMode"
    :disabled="isPinkMode"
    size="small"
  >
    <template #innerLabel>
      <div class="va-text-center">
        <VaIcon :name="isDarkMode == null ? '' : isDarkMode ? 'dark_mode' : 'light_mode'" />
      </div>
    </template>
  </VaSwitch>
</template>

<script setup lang="ts">
import { useDarkModeStore } from '@/stores/darkModeStore'
const DarkModeStore = useDarkModeStore()
const { isDarkMode, isPinkMode, toggleDarkMode, togglePinkMode } = DarkModeStore
import { AddKeyCombo, injectSafe } from '@/symbols'
import { onMounted } from 'vue'

onMounted(() => {
  // Register the key combo and function
  console.log('Mounting a dark mode switch')
  const addKeyCombo = injectSafe(AddKeyCombo)
  addKeyCombo('Cmd+k', togglePinkMode)
})
</script>
