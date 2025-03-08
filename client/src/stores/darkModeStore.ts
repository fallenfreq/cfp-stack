import { defineStore, acceptHMRUpdate } from 'pinia'
import { type Ref, ref } from 'vue'
import { useColors, useGlobalConfig } from 'vuestic-ui'

export const useDarkModeStore = defineStore('darkMode', () => {
  const { applyPreset, currentPresetName } = useColors()

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary')
  const { globalConfig } = useGlobalConfig()
  // Set the primary color to the value of the CSS variable used by other components
  globalConfig.value.colors.presets.light.primary = `rgb(${primaryColor.replace(new RegExp(' ', 'g'), ', ')})`

  // Dark mode starts using the os preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyPreset('dark')
    // The dark class is added in the head of the index.html using the same condition
  }

  const isDarkMode: Ref<boolean | null> = ref(document.documentElement.classList.contains('dark'))
  const isPinkMode = ref(false)

  function toggleDarkMode(event: any) {
    if (event.target['checked']) {
      applyPreset('dark')
      document.documentElement.classList.add('dark')
    } else {
      applyPreset('light')
      document.documentElement.classList.remove('dark')
    }
  }

  let previousMode = currentPresetName.value

  // Secret pink mode
  function togglePinkMode(): void {
    if (currentPresetName.value === 'pink') {
      applyPreset(previousMode)
      document.documentElement.classList.remove('pink')
      document.documentElement.classList.add(previousMode)
      isPinkMode.value = false
      isDarkMode.value = document.documentElement.classList.contains('dark')
      console.log('Secret pink mode deactivated')
    } else {
      previousMode = currentPresetName.value
      applyPreset('pink')
      document.documentElement.classList.add('pink')
      isPinkMode.value = true
      isDarkMode.value = null
      document.documentElement.classList.remove(previousMode)
      console.log('Secret pink mode activated')
    }
  }

  return {
    mode: currentPresetName,
    isDarkMode,
    isPinkMode,
    toggleDarkMode,
    togglePinkMode
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDarkModeStore, import.meta.hot))
}
