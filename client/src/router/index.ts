import { createRouter, createWebHistory } from 'vue-router'
import zitadelAuth from '../services/zitadelAuth'
import HomeView from '../views/HomeView.vue'

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
		// The portfolios are collections now; the old addresses keep working.
		{ path: '/portfolio/branding', redirect: '/c/branding' },
		{ path: '/portfolio/web-design', redirect: '/c/web-design' },
		{
			path: '/account',
			name: 'account',
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => import('../views/AccountView.vue'),
		},
		{
			path: '/admin',
			name: 'admin',
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => {
				if (zitadelAuth.hasRole('admin')) {
					return import('../views/AdminView.vue')
				}
				return import('../views/NoAccess.vue')
			},
		},
		{
			path: '/c/:collectionSlug',
			name: 'collection',
			component: () => import('../views/CollectionView.vue'),
		},
		{
			path: '/admin/pages',
			name: 'admin-pages',
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => {
				if (zitadelAuth.hasRole('admin')) {
					return import('../views/admin/AdminPagesView.vue')
				}
				return import('../views/NoAccess.vue')
			},
		},
		{
			path: '/admin/collections',
			name: 'admin-collections',
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => {
				if (zitadelAuth.hasRole('admin')) {
					return import('../views/admin/AdminCollectionsView.vue')
				}
				return import('../views/NoAccess.vue')
			},
		},
		{
			path: '/editor/:slug?',
			name: 'editor',
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
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => {
				if (zitadelAuth.oidcAuth.isAuthenticated) {
					return import('../views/demo/GoogleMap.vue')
				}
				return import('../views/NoAccess.vue')
			},
		},
	],
})

zitadelAuth.oidcAuth.useRouter(router)

export default router
