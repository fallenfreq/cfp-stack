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
		{
			path: '/portfolio/branding',
			name: 'portfolio-branding',
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import('../views/PortfolioBranding.vue'),
		},
		{
			path: '/portfolio/web-design',
			name: 'portfolio-web-design',
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import('../views/PortfolioWebDesign.vue'),
		},
		{
			path: '/login',
			name: 'login',
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => import('../views/ProfileView.vue'),
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
			path: '/profile',
			name: 'profile',
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => {
				if (zitadelAuth.oidcAuth.isAuthenticated) {
					return import('../views/ProfileView.vue')
				}
				return import('../views/NoAccess.vue')
			},
		},
		{
			path: '/editor-demo',
			name: 'editor',
			meta: {
				authName: zitadelAuth.oidcAuth.authName,
			},
			component: () => {
				if (zitadelAuth.oidcAuth.isAuthenticated) {
					return import('../views/TiptapEditorDemo.vue')
				}
				return import('../views/NoAccess.vue')
			},
		},
		{
			path: '/map-demo',
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
