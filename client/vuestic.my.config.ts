import { createIconsConfig } from 'vuestic-ui'
import {
  processedRootColors,
  processedDarkColors,
  processedPinkColors
} from '@/utils/processTailwindColors'
import cssVariables from './cssVariables.js'

export default {
  // These are the Tailwind defaults instead of Vuestic's being used for consistency
  // if these are changed in Tailwind, they should be updated here too
  // xs is custom
  breakpoints: {
    thresholds: {
      xs: cssVariables.root['--xs'],
      sm: 'var(--sm)',
      md: 'var(--md)',
      lg: 'var(--lg)',
      xl: 'var(--xl)',
      '2xl': 'var(--xxl)'
    }
  },

  components: {
    VaNavbar: {
      // Any component that uses a transition will override the default transition
      style: 'transition: var(--transition);'
    },
    VaSidebarItem: {
      activeColor: 'primary-highlight-hover',
      hoverColor: 'primary-highlight-hover'
    }
  },

  icons: createIconsConfig({
    // va-arrow-down and va-arrow-up were using a deprecated icon from material-icons
    aliases: [
      {
        name: 'va-arrow-down',
        to: 'keyboard_arrow_down'
      },
      {
        name: 'va-arrow-up',
        to: 'keyboard_arrow_up'
      }
    ],
    fonts: [
      // fab- and fas- could be used to pass font awesome v6 icons to Vuestic using web fonts.
      // a custom kit would need to be installed for this to work though
      // Font Awesome is installed as a svg package so you can place as an svg with:
      // <FontAwesomeIcon :icon="faGithub" \>
      {
        name: 'fab-{icon}',
        resolve: ({ icon }) => ({
          content: '',
          class: `fa-brands fa-${icon}`
        })
      },
      {
        name: 'fas-{icon}',
        resolve: ({ icon }) => ({
          content: '',
          class: `fa-solid fa-${icon}`
        })
      },
      // mi- icons are used by Vuestic to set some va- icons
      // This makes sure that the mi- icons also use the rounded material icons
      {
        name: 'mi-{icon}',
        resolve: ({ icon }) => ({
          content: icon || '',
          class: 'material-symbols-rounded'
        })
      },
      {
        name: '{icon}',
        resolve: ({ icon }) => ({
          content: icon || '',
          class: 'material-symbols-rounded'
        })
      }
    ]
  }),
  colors: {
    presets: {
      light: {
        ...processedRootColors
      },
      dark: {
        ...processedRootColors,
        ...processedDarkColors
      },
      pink: {
        ...processedRootColors,
        ...processedPinkColors
      }
    }
    // colors.variables is a shortcut for colors.presets[currentPresetName].
    // setting variables as well as presets will overwrite the presets
    // variables: processedRootColors
  }
}
