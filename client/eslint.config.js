import vueEslintPlugin from 'eslint-plugin-vue'
import base from '../eslint.config.js'

export default [
  ...base,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true // Ensure TSX parsing is supported
        }
      }
    }
  },
  ...vueEslintPlugin.configs['flat/essential']
]
