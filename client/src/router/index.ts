import { createRouter, createWebHistory } from 'vue-router'
import { hasRole, signedIn, signIn, whenSignInKnown } from '../services/session'
import { notify } from '../services/toast'
import HomeView from '../views/HomeView.vue'

declare module 'vue-router' {
	interface RouteMeta {
		// The page needs sign-in.
		signIn?: boolean
		// The page needs this role too: anyone signed in without it goes to No access.
		role?: string
	}
}

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/contact',
			name: 'contact',
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import('../views/ContactView.vue'),
		},
		// The portfolios are collections now, and web design became software development; the old
		// addresses keep working.
		{ path: '/portfolio/branding', redirect: '/c/branding' },
		{ path: '/portfolio/web-design', redirect: '/c/software-development' },
		{
			path: '/account',
			name: 'account',
			meta: { signIn: true },
			component: () => import('../views/AccountView.vue'),
		},
		{
			path: '/admin',
			name: 'admin',
			meta: { signIn: true, role: 'admin' },
			component: () => import('../views/AdminView.vue'),
		},
		{
			path: '/c/:collectionSlug',
			name: 'collection',
			component: () => import('../views/CollectionView.vue'),
		},
		{
			path: '/admin/pages',
			name: 'admin-pages',
			meta: { signIn: true, role: 'admin' },
			component: () => import('../views/admin/AdminPagesView.vue'),
		},
		{
			path: '/admin/collections',
			name: 'admin-collections',
			meta: { signIn: true, role: 'admin' },
			component: () => import('../views/admin/AdminCollectionsView.vue'),
		},
		{
			// The demo and the layout test cases, open to anyone, and a new page.
			path: '/editor',
			name: 'editor',
			component: () => import('../views/TiptapEditorDemo.vue'),
		},
		{
			// A stored page, for admins. The same view as /editor: moving between the two keeps it.
			path: '/editor/:slug',
			name: 'editor-page',
			meta: { signIn: true, role: 'admin' },
			component: () => import('../views/TiptapEditorDemo.vue'),
		},
		{
			// The demo content built into the app, so it's the same locally and live and reads
			// nothing from the database.
			path: '/demo/editor',
			redirect: { name: 'editor', query: { seed: 'true' } },
		},
		{
			path: '/preview/:slug',
			name: 'page-preview',
			component: () => import('../views/PagePreview.vue'),
		},
		{
			path: '/demo/map',
			name: 'map',
			meta: { signIn: true },
			component: () => import('../views/demo/GoogleMap.vue'),
		},
		{
			path: '/no-access',
			name: 'no-access',
			component: () => import('../views/NoAccess.vue'),
		},
	],
})

// A page that needs sign-in waits until it's known whether you're signed in. Not signed in: off to
// sign in, coming back here. Signed in without the page's role: No access. Not known (the server
// didn't answer): home, saying so. Decided on every visit, not when a page's code first loads (the
// router keeps that until a reload).
router.beforeEach(async (to) => {
	if (!to.meta.signIn) return
	if (!(await whenSignInKnown())) {
		notify({
			message: "Signing in isn't working right now. Please try again later.",
			variant: 'danger',
		})
		return { name: 'home' }
	}
	if (!signedIn.value) {
		signIn(to.fullPath)
		return false
	}
	if (to.meta.role && !hasRole(to.meta.role)) return { name: 'no-access' }
})

export default router
