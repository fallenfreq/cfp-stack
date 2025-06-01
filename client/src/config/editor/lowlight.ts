// load all languages with "all" or common languages with "common"
import { createLowlight } from 'lowlight'

// You can also register languages individually
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import py from 'highlight.js/lib/languages/python'
import ts from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'

// Create a lowlight instance
const lowlight = createLowlight()

lowlight.register('html', xml)
lowlight.register('css', css)
lowlight.register('json', json)
lowlight.register('javascript', js)
lowlight.register('typescript', ts)
lowlight.register('python', py)

type Lowlight = typeof lowlight
export { lowlight, type Lowlight }
