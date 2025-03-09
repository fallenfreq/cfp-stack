import { publicProcedure, router } from '../../config/trpc.js'
import { collectionEntries } from '../../schemas/collectionEntry.js'
import { eq } from 'drizzle-orm'

// return test items or throw to test without having to add items to the database
// return [
//   {
//     id: 1,
//     description: 'This is a real item',
//     imageUrl: 'https://placecats.com/400/300',
//     title: 'Real item',
//     isPlaceholder: false
//   }
// ]
// throw new Error('not implemented')

export const portfolioRouter = router({
  entry: publicProcedure.query(async (opt) => {
    return opt.ctx.db
      .select()
      .from(collectionEntries)
      .where(eq(collectionEntries.type, 'portfolio'))
  })
})
