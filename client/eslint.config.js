import vueEslintPlugin from 'eslint-plugin-vue'
import base from '../eslint.config.js'

export default [...base, ...vueEslintPlugin.configs['flat/essential']]
