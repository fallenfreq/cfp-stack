import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'

const usePublicTags = () =>
	useQuery({
		queryKey: ['tags', 'public'],
		queryFn: () => trpc.publicTags.list.query(),
	})

const useAllTags = () =>
	useQuery({
		queryKey: ['tags', 'all'],
		queryFn: () => trpc.adminTags.list.query(),
	})

export { useAllTags, usePublicTags }
