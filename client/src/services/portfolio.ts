import { trpc } from '@/trpc'
import { useService } from '@/utils/useService'

const getPortfolioEntries = () => {
  return useService(trpc.portfolio.entry.query)
}

export { getPortfolioEntries }
