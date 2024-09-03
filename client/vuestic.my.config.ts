import { createIconsConfig } from 'vuestic-ui'
import {
  processedRootColors,
  processedDarkColors,
  processedPinkColors
} from '@/utils/processTailwindColors'
import cssVariables from './cssVariables.js'

export default {
  // These are the Tailwind defaults instead of Vuestics being used for consistency
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
      // fa- icons are used to pass brand icons to Vuestic using webfonts
      // Font Awesome is installed as a package too so you can placed as an svg with:
      // <FontAwesomeIcon :icon="faGithub" \>
      {
        name: 'fa-{icon}',
        resolve: ({ icon }) => ({
          content: icon,
          class: 'fa-brands'
        })
      },
      // mi- icons are used by vustic to set some va- icons
      // This makes sure that the mi- icons also use the rounded material icons
      {
        name: 'mi-{icon}',
        resolve: ({ icon }) => ({
          content: icon,
          class: 'material-symbols-rounded'
        })
      },
      {
        name: '{icon}',
        resolve: ({ icon }) => ({
          content: icon,
          class: 'material-symbols-rounded'
        })
      }
    ]
  }),
  // The || hex value is the default value that Vuestic uses
  // its here more for reference than anything else
  // primary is also a root colour so it's overriden by the root colours
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
    },
    // colors.variables is a shorcut for colors.presets[currentPresetName].
    // setting variables aswell as presets will overwrite the presets
    variables: processedRootColors
  }
}
