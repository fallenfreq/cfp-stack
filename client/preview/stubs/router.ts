// Stand-in for '@/router'. The app's router follows the browser's address, which the preview
// doesn't have; nothing in the preview navigates with it, so a router with no pages stands in.
import { createMemoryHistory, createRouter } from 'vue-router'

export default createRouter({ history: createMemoryHistory(), routes: [] })
