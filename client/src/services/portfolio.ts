import { trpc } from '@/trpc'
import { useQuery } from '@tanstack/vue-query'

const getPortfolioEntries = () => {
  return useQuery({
    queryKey: ['getPortfolioEntries'],
    queryFn: () => trpc.portfolio.entry.query()
  })
}

export { getPortfolioEntries }
