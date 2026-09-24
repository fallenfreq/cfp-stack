// The real editor is CodeMirror plus the dark-mode store, which need a browser. The preview
// never shows a `style` row, so an empty component stands in.
import { defineComponent } from 'vue'

export default defineComponent({ name: 'StyleAttrEditor', render: () => null })
