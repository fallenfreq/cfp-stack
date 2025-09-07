import { trpc } from '@/trpc'
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'

const getPortfolioEntries = (
	queryKey: QueryFunctionContext<['brandPortfolio' | 'webDesignPortfolio']>['queryKey'],
) => {
	return useQuery({
		queryKey,
		// ctx is passed to the queryFn
		queryFn: () => trpc.portfolio.entry.query(),
	})
}

export { getPortfolioEntries }
