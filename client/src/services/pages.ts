import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

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

// The address can change while the page stays (one collection to the next); the pages follow it.
const usePagesByCollection = (collectionSlug: MaybeRefOrGetter<string>) =>
	useQuery({
		queryKey: computed(() => ['pages', 'collection', toValue(collectionSlug)]),
		queryFn: () =>
			trpc.publicPages.listByCollection.query({ collectionSlug: toValue(collectionSlug) }),
	})

const usePagesByCollectionAdmin = (collectionSlug: MaybeRefOrGetter<string>) =>
	useQuery({
		queryKey: computed(() => ['pages', 'collection-admin', toValue(collectionSlug)]),
		queryFn: () =>
			trpc.adminPages.listByCollection.query({ collectionSlug: toValue(collectionSlug) }),
	})

export { useAllPages, usePagesByCollection, usePagesByCollectionAdmin, usePublicPages }
