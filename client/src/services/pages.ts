import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'

const usePublicPages = () =>
	useQuery({
		queryKey: ['pages', 'public'],
		queryFn: () => trpc.publicPages.list.query(),
	})

const useAllPages = () =>
	useQuery({
		queryKey: ['pages', 'all'],
		queryFn: () => trpc.adminPages.list.query(),
	})

const usePagesByCollection = (collectionSlug: string) =>
	useQuery({
		queryKey: ['pages', 'collection', collectionSlug],
		queryFn: () => trpc.publicPages.listByCollection.query({ collectionSlug }),
	})

const usePagesByCollectionAdmin = (collectionSlug: string) =>
	useQuery({
		queryKey: ['pages', 'collection-admin', collectionSlug],
		queryFn: () => trpc.adminPages.listByCollection.query({ collectionSlug }),
	})

export { useAllPages, usePagesByCollection, usePagesByCollectionAdmin, usePublicPages }
