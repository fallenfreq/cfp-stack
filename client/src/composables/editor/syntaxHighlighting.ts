import { ref, watch, onMounted, onUnmounted } from 'vue'
// import 'highlight.js/lib/common'
import { useDarkModeStore } from '@/stores/darkModeStore'

import lightTheme from 'highlight.js/styles/base16/ros-pine-dawn.min.css?url'
import darkTheme from 'highlight.js/styles/base16/ros-pine-moon.min.css?url'

// best contenders, However they still clash.
// Using darkTheme for pink mode for now
// import pinkTheme from 'highlight.js/styles/base16/cupcake.min.css?url'
// import pinkTheme2 from 'highlight.js/styles/base16/horizon-light.min.css?url'
// import pinkTheme3 from 'highlight.js/styles/base16/atelier-cave-light.min.css?url'

//TODO: Add strict typing for themes
const themes: Record<string, string> = {
  light: lightTheme,
  dark: darkTheme,
  pink: darkTheme
}

const useSyntaxHighlighting = () => {
  const darkModeStore = useDarkModeStore()
  const themeLink = ref<HTMLLinkElement | null>(null)

  const updateHighlightTheme = (theme: string) => {
    if (!themeLink.value) {
      themeLink.value = document.createElement('link')
      themeLink.value.rel = 'stylesheet'
      themeLink.value.type = 'text/css'
      document.head.appendChild(themeLink.value)
    }

    themeLink.value.href = themes[theme]
  }
  watch(
    () => darkModeStore.mode,
    (newVal) => {
      updateHighlightTheme(newVal)
    }
  )

  onMounted(() => {
    updateHighlightTheme(darkModeStore.mode)
  })

  onUnmounted(() => {
    if (themeLink.value) {
      themeLink.value.remove()
      themeLink.value = null
    }
  })
}

export { useSyntaxHighlighting }
